import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Simulated rival traders for the leaderboard. Generated once from a fixed seed, then each
 * minute every rival has a chance to trade (random walk biased by their skill), take a payout,
 * get funded or breach. Missed minutes are caught up on load so it feels like time passed.
 */

export const TICK_MS = 60_000;
const COUNT = 100;
const MAX_CATCHUP = 240;

export interface Rival {
  name: string;
  skill: number; // drift per trade, $ (can be negative)
  vol: number; // per-trade P&L std dev, $
  pnl: number;
  payouts: number;
  funded: number;
  trades: number;
  wins: number;
  last: number; // P&L change on the latest tick
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (rand: () => number) => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
const round5 = (n: number) => Math.round(n / 5) * 5;

// The original hand-written rivals stay in the mix.
const CLASSICS = ['diamondhands_dev', 'ramen_capital', 'stoploss_skipper', 'theta_gang_intern', 'candle_whisperer', 'vwap_or_nothing', 'revenge_trader_99', 'buy_high_sell_low'];

const FIRST = ['nq', 'es', 'scalp', 'fvg', 'liquidity', 'orderblock', 'tape', 'ict', 'delta', 'gamma', 'vwap', 'smc', 'wick', 'sweep', 'pip', 'tick', 'futures', 'apex', 'mindset', 'lambo', 'ramen', 'degen', 'bagholder', 'chart', 'algo', 'silver_bullet', 'killzone', 'asia', 'london', 'ny_open'];
const SECOND = ['sniper', 'king', 'queen', 'god', 'goblin', 'wizard', 'bro', 'chad', 'monk', 'whale', 'shrimp', 'gremlin', 'samurai', 'ninja', 'enjoyer', 'merchant', 'larper', 'demon', 'prophet', 'intern', 'goat', 'hunter', 'farmer', 'maxi', 'andy'];
const SUFFIX = ['', '', '', '_fx', '_trades', '_capital', '_dev', 'x', '_irl', '_official'];

function generate(): Rival[] {
  const rand = mulberry32(0x1a2b);
  const names = new Set(CLASSICS);
  while (names.size < COUNT) {
    const n = `${FIRST[Math.floor(rand() * FIRST.length)]}_${SECOND[Math.floor(rand() * SECOND.length)]}${SUFFIX[Math.floor(rand() * SUFFIX.length)]}`;
    names.add(rand() < 0.3 ? `${n}${Math.floor(rand() * 99) + 1}` : n);
  }
  return [...names].map((name) => {
    const talent = gauss(rand); // ~N(0,1); most traders slightly negative after fees
    const skill = talent * 18 - 6;
    const vol = 120 + rand() * 380;
    const trades = 20 + Math.floor(rand() * 380);
    const pnl = round5(skill * trades + gauss(rand) * vol * Math.sqrt(trades));
    const funded = pnl > 0 ? Math.min(5, Math.floor(pnl / 6000 + rand() * 1.5)) : rand() < 0.15 ? 1 : 0;
    const payouts = funded > 0 && pnl > 1500 ? round5(pnl * (0.25 + rand() * 0.35)) : 0;
    const winRate = Math.min(0.75, Math.max(0.2, 0.47 + talent * 0.07 + gauss(rand) * 0.03));
    return { name, skill, vol, pnl, payouts, funded, trades, wins: Math.round(trades * winRate), last: 0 };
  });
}

function step(r: Rival): Rival {
  const rand = Math.random;
  let { pnl, payouts, funded, trades, wins } = r;
  let last = 0;
  if (rand() < 0.4) {
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const d = round5(r.skill + gauss(rand) * r.vol);
      last += d;
      trades += 1;
      if (d >= 0) wins += 1;
    }
    pnl += last;
  }
  const withdrawable = pnl - payouts;
  if (funded > 0 && withdrawable > 2500 && rand() < 0.004) payouts += round5(withdrawable * (0.15 + rand() * 0.25));
  if (last > 0 && pnl > 4000 * (funded + 1) && rand() < 0.02) funded += 1;
  if (last < -400 && funded > 0 && rand() < 0.03) funded -= 1; // breached one
  return { ...r, pnl, payouts, funded, trades, wins, last };
}

interface RivalState {
  rivals: Rival[];
  lastTick: number;
  tick: () => void;
}

export const useRivals = create<RivalState>()(
  persist(
    (set, get) => ({
      rivals: generate(),
      lastTick: Date.now(),
      tick: () => {
        const { lastTick } = get();
        const due = Math.floor((Date.now() - lastTick) / TICK_MS);
        if (due < 1) return;
        const missed = Math.min(MAX_CATCHUP, due);
        let rivals = get().rivals;
        for (let i = 0; i < missed; i++) rivals = rivals.map(step);
        // Stay aligned to the minute grid, unless we were away longer than the catch-up cap.
        set({ rivals, lastTick: due > MAX_CATCHUP ? Date.now() : lastTick + due * TICK_MS });
      },
    }),
    { name: 'larpcapital-rivals', version: 1 },
  ),
);

export function startRivals() {
  const { tick } = useRivals.getState();
  tick();
  const id = setInterval(() => useRivals.getState().tick(), 5_000);
  return () => clearInterval(id);
}

export const winRate = (r: Pick<Rival, 'trades' | 'wins'>) => (r.trades ? Math.round((r.wins / r.trades) * 100) : 0);
