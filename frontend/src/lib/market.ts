import { create } from 'zustand';
import { INSTRUMENTS, ROOTS, Root, Sym, roundToTick } from './instruments';

export interface Candle {
  time: number; // unix seconds (sim clock)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RootState {
  last: number;
  sessionOpen: number;
  candles: Candle[]; // 1-minute candles, mutated in place for speed
  drift: number;
}

interface MarketState {
  simTime: number;
  speed: number;
  paused: boolean;
  roots: Record<Root, RootState>;
  tick: () => void;
  setSpeed: (s: number) => void;
  setPaused: (p: boolean) => void;
}

const MAX_CANDLES = 3000;
const SECONDS_PER_DAY = 23400;

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function seedRoot(root: Root, now: number): RootState {
  const cfg = ROOTS[root];
  const candles: Candle[] = [];
  const count = 900;
  let price = cfg.start * (1 + gauss() * 0.004);
  let drift = 0;
  const start = Math.floor(now / 60) * 60 - count * 60;
  for (let i = 0; i < count; i++) {
    const sigma = (price * cfg.vol) / Math.sqrt(390);
    drift = drift * 0.95 + gauss() * 0.03;
    const open = price;
    const close = roundToTick(open + sigma * (gauss() + drift), cfg.tick);
    const high = roundToTick(Math.max(open, close) + Math.abs(gauss()) * sigma * 0.45, cfg.tick);
    const low = roundToTick(Math.min(open, close) - Math.abs(gauss()) * sigma * 0.45, cfg.tick);
    candles.push({ time: start + i * 60, open, high, low, close, volume: Math.round(800 + Math.random() * 2500) });
    price = close;
  }
  return { last: price, sessionOpen: candles[candles.length - 390].open, candles, drift: 0 };
}

const now0 = Math.floor(Date.now() / 1000);

export const useMarket = create<MarketState>((set, get) => ({
  simTime: now0,
  speed: 1,
  paused: false,
  roots: {
    NQ: seedRoot('NQ', now0),
    ES: seedRoot('ES', now0),
    CL: seedRoot('CL', now0),
    GC: seedRoot('GC', now0),
  },
  setSpeed: (speed) => set({ speed }),
  setPaused: (paused) => set({ paused }),
  tick: () => {
    const { simTime, speed, roots, paused } = get();
    if (paused) return;
    const dt = speed;
    const t = simTime + dt;
    const next = {} as Record<Root, RootState>;
    (Object.keys(roots) as Root[]).forEach((root) => {
      const cfg = ROOTS[root];
      const r = roots[root];
      // regime-switching drift so the chart actually trends sometimes
      let drift = r.drift * 0.99 + gauss() * 0.02;
      if (Math.random() < 0.002) drift += gauss() * 0.4;
      const sigma = ((r.last * cfg.vol) / Math.sqrt(SECONDS_PER_DAY)) * Math.sqrt(dt);
      const last = roundToTick(r.last + sigma * (gauss() + drift * 0.25), cfg.tick);

      const bucket = Math.floor(t / 60) * 60;
      const c = r.candles;
      const lastCandle = c[c.length - 1];
      const vol = Math.round(Math.random() * 40 * dt);
      if (lastCandle.time === bucket) {
        c[c.length - 1] = {
          ...lastCandle,
          high: Math.max(lastCandle.high, last),
          low: Math.min(lastCandle.low, last),
          close: last,
          volume: lastCandle.volume + vol,
        };
      } else {
        c.push({ time: bucket, open: lastCandle.close, high: Math.max(lastCandle.close, last), low: Math.min(lastCandle.close, last), close: last, volume: vol });
        if (c.length > MAX_CANDLES) c.splice(0, c.length - MAX_CANDLES);
      }
      next[root] = { ...r, last, drift };
    });
    set({ simTime: t, roots: next });
  },
}));

export interface Quote {
  bid: number;
  ask: number;
  last: number;
}

export function quoteFor(sym: Sym, roots = useMarket.getState().roots): Quote {
  const ins = INSTRUMENTS[sym];
  const last = roots[ins.root].last;
  return { bid: last, ask: roundToTick(last + ins.tick, ins.tick), last };
}

export function useQuote(sym: Sym): Quote {
  const last = useMarket((s) => s.roots[INSTRUMENTS[sym].root].last);
  const tick = INSTRUMENTS[sym].tick;
  return { bid: last, ask: roundToTick(last + tick, tick), last };
}
