import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Minus, Pause, Play, Plus, X } from 'lucide-react';
import CandleChart, { ChartLine } from '../components/CandleChart';
import { Btn, Label, Tag } from '../components/ui';
import { CONTRACT_MONTH, INSTRUMENTS, SYMBOLS, Sym } from '../lib/instruments';
import { INDICATORS, IndicatorId } from '../lib/indicators';
import { quoteFor, useMarket, useQuote } from '../lib/market';
import { Account, Side, equity, unrealized, useApp } from '../lib/store';
import { planById } from '../lib/plans';
import { money, pnlClass, price } from '../lib/format';

const TFS: [number, string][] = [
  [60, '1m'],
  [300, '5m'],
  [900, '15m'],
  [3600, '1h'],
];
const SPEEDS = [1, 5, 20, 60];

function useActiveAccount(): Account | undefined {
  const accounts = useApp((s) => s.accounts);
  const activeId = useApp((s) => s.activeAccountId);
  const a = accounts.find((x) => x.id === activeId);
  if (a && a.status === 'active') return a;
  return accounts.find((x) => x.status === 'active');
}

function Dropdown({ label, children, width = 220 }: { label: React.ReactNode; children: React.ReactNode; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-ink hover:bg-panel2">
        {label} <ChevronDown size={12} className="text-dim" />
      </button>
      {open && (
        <div onClick={() => setOpen(false)} className="absolute left-0 top-full z-30 mt-1 rounded-lg border border-line2 bg-panel p-1 shadow-2xl" style={{ width }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] hover:bg-panel2 ${active ? 'text-ink' : 'text-mute'}`}>
      {children}
    </button>
  );
}

export default function Trade() {
  const nav = useNavigate();
  const [sym, setSym] = useState<Sym>('MNQ');
  const [tf, setTf] = useState(60);
  const [indicators, setIndicators] = useState<IndicatorId[]>(['volume', 'vwap', 'ema50']);
  const [qty, setQty] = useState(1);
  const ins = INSTRUMENTS[sym];
  const q = useQuote(sym);
  const speed = useMarket((s) => s.speed);
  const paused = useMarket((s) => s.paused);
  const setSpeed = useMarket((s) => s.setSpeed);
  const setPaused = useMarket((s) => s.setPaused);
  const candles = useMarket((s) => s.roots[ins.root]);
  const accounts = useApp((s) => s.accounts);
  const setActive = useApp((s) => s.setActiveAccount);
  const placeOrder = useApp((s) => s.placeOrder);
  const settleDay = useApp((s) => s.settleDay);
  const acc = useActiveAccount();

  const lastCandle = candles.candles[candles.candles.length - 1];

  const lines: ChartLine[] = useMemo(() => {
    if (!acc) return [];
    const out: ChartLine[] = [];
    const sameRoot = (s: Sym) => INSTRUMENTS[s].root === ins.root;
    for (const [s, p] of Object.entries(acc.positions) as [Sym, NonNullable<Account['positions'][Sym]>][]) {
      if (!sameRoot(s) || !p) continue;
      out.push({ price: p.avg, color: p.qty > 0 ? '#2962ff' : '#f2545b', title: `${p.qty > 0 ? 'LONG' : 'SHORT'} ${Math.abs(p.qty)} ${s}` });
    }
    for (const o of acc.orders) {
      if (!sameRoot(o.sym)) continue;
      const c = o.label === 'TP' ? '#2fd98a' : o.label === 'SL' ? '#f2545b' : '#f5b83d';
      out.push({ price: o.price, color: c, title: `${o.label ?? o.type.toUpperCase()} ${o.side === 1 ? 'B' : 'S'}${o.qty}`, dashed: true });
    }
    out.push({ price: acc.mll, color: '#f2545b88', title: 'MLL', dashed: true });
    return out.filter((l) => Math.abs(l.price - q.last) / q.last < 0.2);
  }, [acc, ins.root, q.last > 0]);

  const quick = (side: Side) => acc && placeOrder(acc.id, { sym, side, type: 'market', qty });

  return (
    <div className="flex h-full flex-col bg-[#0b0c0e]">
      {/* toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-line px-2">
        <Dropdown label={<span className="font-mono">{sym}{CONTRACT_MONTH}</span>} width={260}>
          {SYMBOLS.map((s) => (
            <MenuItem key={s} active={s === sym} onClick={() => setSym(s)}>
              <span className="font-mono font-semibold">{s}{CONTRACT_MONTH}</span>
              <span className="text-[11px] text-dim">{INSTRUMENTS[s].name}</span>
            </MenuItem>
          ))}
        </Dropdown>
        <div className="mx-1 h-5 w-px bg-line" />
        {TFS.map(([v, l]) => (
          <button key={v} onClick={() => setTf(v)} className={`rounded-md px-2 py-1 font-mono text-[12px] ${tf === v ? 'bg-panel2 text-ink' : 'text-mute hover:text-ink'}`}>
            {l}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-line" />
        <Dropdown label="Indicators" width={240}>
          {INDICATORS.map((i) => {
            const on = indicators.includes(i.id);
            return (
              <MenuItem key={i.id} active={on} onClick={() => setIndicators(on ? indicators.filter((x) => x !== i.id) : [...indicators, i.id])}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: i.color }} />
                  {i.label}
                </span>
                {on && <span className="text-up">✓</span>}
              </MenuItem>
            );
          })}
        </Dropdown>
        <div className="mx-1 h-5 w-px bg-line" />
        <button onClick={() => setPaused(!paused)} className="rounded-md p-1.5 text-mute hover:bg-panel2 hover:text-ink" title={paused ? 'Resume feed' : 'Pause feed'}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
        <div className="flex items-center rounded-md border border-line">
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 font-mono text-[11px] ${speed === s ? 'bg-panel2 text-up' : 'text-dim hover:text-ink'}`}>
              {s}x
            </button>
          ))}
        </div>
        <span className="ml-1 hidden font-mono text-[10px] text-dim xl:inline">SIM FEED</span>
        <div className="ml-auto flex items-center gap-2">
          <Btn className="py-1.5" onClick={settleDay}>
            Settle day
          </Btn>
          <Dropdown label={acc ? <span className="font-mono">{acc.id}</span> : 'No active account'} width={300}>
            {accounts.map((a) => (
              <MenuItem key={a.id} active={a.id === acc?.id} onClick={() => a.status === 'active' && setActive(a.id)}>
                <span className={a.status === 'active' ? '' : 'opacity-40'}>
                  <span className="block font-mono">{a.id}</span>
                  <span className="text-[10px] text-dim">{planById(a.planId).name} · {a.type}</span>
                </span>
                <span className="font-mono text-[11px]">{money(a.balance)}</span>
              </MenuItem>
            ))}
            <MenuItem onClick={() => nav('/add')}>
              <span className="text-up">+ Add account</span>
            </MenuItem>
          </Dropdown>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* chart + bottom panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <CandleChart root={ins.root} label={`${sym}${CONTRACT_MONTH} · ${TFS.find((t) => t[0] === tf)![1]}`} tf={tf} indicators={indicators} lines={lines} />
            <div className="pointer-events-none absolute left-3 top-2 z-10">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-semibold">{ins.name} Futures · {TFS.find((t) => t[0] === tf)![1]} · CME</span>
                <span className="h-2 w-2 rounded-full bg-up shadow-[0_0_8px_#2fd98a]" />
                <span className="font-mono text-[11px] text-mute">
                  O<span className={pnlClass(lastCandle.close - lastCandle.open)}>{price(lastCandle.open, sym)}</span> H<span className={pnlClass(lastCandle.close - lastCandle.open)}>{price(lastCandle.high, sym)}</span> L
                  <span className={pnlClass(lastCandle.close - lastCandle.open)}>{price(lastCandle.low, sym)}</span> C<span className={pnlClass(lastCandle.close - lastCandle.open)}>{price(lastCandle.close, sym)}</span>
                </span>
              </div>
              <div className="pointer-events-auto mt-2 flex items-stretch gap-1">
                <button onClick={() => quick(-1)} disabled={!acc} className="rounded-md bg-down px-3 py-1 text-left text-white hover:brightness-110 disabled:opacity-40">
                  <div className="font-mono text-[13px] font-semibold">{price(q.bid, sym)}</div>
                  <div className="text-[9px] font-bold">SELL</div>
                </button>
                <div className="flex flex-col items-center justify-center px-1 font-mono text-[10px] text-mute">
                  <span>{price(q.ask - q.bid, sym)}</span>
                  <span className="text-[12px] text-ink">{qty}</span>
                </div>
                <button onClick={() => quick(1)} disabled={!acc} className="rounded-md bg-buy px-3 py-1 text-left text-white hover:brightness-110 disabled:opacity-40">
                  <div className="font-mono text-[13px] font-semibold">{price(q.ask, sym)}</div>
                  <div className="text-[9px] font-bold">BUY</div>
                </button>
              </div>
            </div>
          </div>
          <BottomPanel acc={acc} onQuick={quick} />
        </div>

        <OrderPanel acc={acc} sym={sym} qty={qty} setQty={setQty} />
        <Watchlist sym={sym} setSym={setSym} />
      </div>
    </div>
  );
}

function OrderPanel({ acc, sym, qty, setQty }: { acc?: Account; sym: Sym; qty: number; setQty: (n: number) => void }) {
  const nav = useNavigate();
  const ins = INSTRUMENTS[sym];
  const q = useQuote(sym);
  const placeOrder = useApp((s) => s.placeOrder);
  const [side, setSide] = useState<Side>(1);
  const [type, setType] = useState<'market' | 'limit' | 'stop'>('market');
  const [px, setPx] = useState<string>('');
  const [tpOn, setTpOn] = useState(false);
  const [slOn, setSlOn] = useState(false);
  const [tp, setTp] = useState(40);
  const [sl, setSl] = useState(20);

  useEffect(() => setPx(''), [sym, type]);
  const entry = type === 'market' ? (side === 1 ? q.ask : q.bid) : Number(px) || q.last;

  if (!acc) {
    return (
      <div className="flex w-[300px] shrink-0 flex-col items-center justify-center border-l border-line p-6 text-center">
        <div className="text-sm font-semibold">No active account</div>
        <div className="mt-1 text-xs text-mute">Buy an evaluation to start trading. It costs $0, which is the only price larpers pay.</div>
        <Btn tone="green" className="mt-4" onClick={() => nav('/add')}>
          Add account
        </Btn>
      </div>
    );
  }

  const plan = planById(acc.planId);
  const eq = equity(acc);
  const dayPnl = eq - acc.dayStartBalance;
  const notional = entry * ins.pointValue * qty;

  const submit = () =>
    placeOrder(acc.id, {
      sym,
      side,
      type,
      qty,
      price: type === 'market' ? undefined : entry,
      tpTicks: tpOn ? tp : undefined,
      slTicks: slOn ? sl : undefined,
    });

  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold">{sym}{CONTRACT_MONTH}</span>
          <Tag tone={acc.type === 'funded' ? 'green' : 'neutral'}>{acc.type}</Tag>
        </div>
        <span className="font-mono text-[10px] text-dim">{plan.name}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-line">
        <button onClick={() => setSide(-1)} className={`p-2.5 text-left ${side === -1 ? 'bg-down/90 text-white' : 'bg-panel2 text-down'}`}>
          <div className="text-[11px] font-semibold">Sell</div>
          <div className="font-mono text-[15px]">{price(q.bid, sym)}</div>
        </button>
        <button onClick={() => setSide(1)} className={`p-2.5 text-right ${side === 1 ? 'bg-buy text-white' : 'bg-panel2 text-[#7aa2ff]'}`}>
          <div className="text-[11px] font-semibold">Buy</div>
          <div className="font-mono text-[15px]">{price(q.ask, sym)}</div>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 border-b border-line">
        {(['market', 'limit', 'stop'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`pb-2 text-[12px] capitalize ${type === t ? 'border-b-2 border-ink text-ink' : 'text-mute'}`}>
            {t}
          </button>
        ))}
      </div>

      {type !== 'market' && (
        <div className="mt-3">
          <Label>{type} price</Label>
          <input
            value={px}
            placeholder={price(q.last, sym)}
            onChange={(e) => setPx(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line2 bg-panel2 px-3 py-2 font-mono text-[13px] outline-none focus:border-buy"
          />
        </div>
      )}

      <div className="mt-3">
        <Label>Contracts</Label>
        <div className="mt-1 flex items-center rounded-lg border border-line2 bg-panel2">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-mute hover:text-ink">
            <Minus size={14} />
          </button>
          <input value={qty} onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="w-full bg-transparent text-center font-mono text-[14px] outline-none" />
          <button onClick={() => setQty(qty + 1)} className="p-2 text-mute hover:text-ink">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-lg bg-panel p-3 font-mono text-[11px]">
        {[
          ['Notional', money(notional)],
          ['Tick value', money(ins.tick * ins.pointValue, { cents: true })],
          ['Commission', money(ins.commission * qty, { cents: true }) + ' /side'],
          ['Max size', `${plan.maxMinis} minis`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-mute">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <Label>Exits</Label>
        {[
          { on: tpOn, set: setTpOn, v: tp, setV: setTp, name: 'Take profit', dir: side },
          { on: slOn, set: setSlOn, v: sl, setV: setSl, name: 'Stop loss', dir: -side },
        ].map((x) => (
          <div key={x.name}>
            <div className="flex items-center justify-between text-[12px] text-mute">
              {x.name}
              <button onClick={() => x.set(!x.on)} className={`h-4 w-8 rounded-full p-0.5 transition ${x.on ? 'bg-up' : 'bg-line2'}`}>
                <div className={`h-3 w-3 rounded-full bg-white transition ${x.on ? 'translate-x-4' : ''}`} />
              </button>
            </div>
            <div className={`mt-1 flex items-center gap-2 rounded-lg border border-line2 bg-panel2 px-3 py-1.5 font-mono text-[12px] ${x.on ? '' : 'opacity-40'}`}>
              <span className="flex-1">{price(entry + x.dir * x.v * ins.tick, sym)}</span>
              <input value={x.v} onChange={(e) => x.setV(Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="w-12 bg-transparent text-right outline-none" />
              <span className="text-dim">ticks</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={submit} className={`mt-4 rounded-lg py-3 text-center text-white hover:brightness-110 ${side === 1 ? 'bg-buy' : 'bg-down'}`}>
        <div className="text-[14px] font-bold">{side === 1 ? 'Buy' : 'Sell'}</div>
        <div className="font-mono text-[10px] font-semibold opacity-90">
          {qty} {sym}{CONTRACT_MONTH} {type.toUpperCase()}
        </div>
      </button>

      <div className="mt-4 space-y-2 rounded-lg border border-line p-3">
        <Label>Risk desk</Label>
        <RiskRow label="Equity" value={money(eq, { cents: true })} />
        <RiskRow label="Max loss limit" value={money(acc.mll)} sub={`${money(eq - acc.mll)} away`} danger={eq - acc.mll < plan.drawdown * 0.25} />
        {plan.dll && <RiskRow label="Daily loss limit" value={money(-plan.dll)} sub={`today ${money(dayPnl, { sign: true })}`} danger={dayPnl < -plan.dll * 0.75} />}
        {acc.type === 'eval' && <RiskRow label="To target" value={money(Math.max(0, acc.startBalance + plan.target - acc.balance))} sub={`${Math.min(100, Math.max(0, ((acc.balance - acc.startBalance) / plan.target) * 100)).toFixed(0)}%`} />}
      </div>
    </div>
  );
}

function RiskRow({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between font-mono text-[11px]">
      <span className="text-mute">{label}</span>
      <span className={danger ? 'text-down' : ''}>
        {value} {sub && <span className="text-[10px] text-dim">· {sub}</span>}
      </span>
    </div>
  );
}

function Watchlist({ sym, setSym }: { sym: Sym; setSym: (s: Sym) => void }) {
  const roots = useMarket((s) => s.roots);
  const ins = INSTRUMENTS[sym];
  const r = roots[ins.root];
  const chg = r.last - r.sessionOpen;
  const sessionCandles = r.candles.slice(-390);
  const hi = Math.max(...sessionCandles.map((c) => c.high));
  const lo = Math.min(...sessionCandles.map((c) => c.low));
  const vol = sessionCandles.reduce((s, c) => s + c.volume, 0);
  return (
    <div className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line 2xl:flex">
      <div className="flex items-center justify-between px-3 py-2.5 text-[13px] font-semibold">Watchlist</div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 pb-1 text-[11px] text-dim">
        <span>Symbol</span>
        <span className="text-right">Last</span>
        <span className="text-right">Chg</span>
        <span className="text-right">Chg%</span>
      </div>
      {SYMBOLS.map((s) => {
        const rr = roots[INSTRUMENTS[s].root];
        const c = rr.last - rr.sessionOpen;
        return (
          <button
            key={s}
            onClick={() => setSym(s)}
            className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-1.5 text-left font-mono text-[12px] hover:bg-panel2 ${s === sym ? 'bg-panel2' : ''}`}
          >
            <span className="font-semibold">{s}</span>
            <span className="text-right">{price(rr.last, s)}</span>
            <span className={`text-right ${pnlClass(c)}`}>{c.toFixed(2)}</span>
            <span className={`w-12 text-right ${pnlClass(c)}`}>{((c / rr.sessionOpen) * 100).toFixed(2)}%</span>
          </button>
        );
      })}
      <div className="mx-3 my-3 border-t border-line" />
      <div className="px-3">
        <div className="font-mono text-[13px] font-bold">{sym}{CONTRACT_MONTH}</div>
        <div className="text-[11px] text-mute">{ins.name} Futures · CME</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="font-mono text-3xl font-semibold">{price(r.last, sym)}</span>
          <span className="text-[11px] text-mute">USD</span>
        </div>
        <div className={`font-mono text-sm font-semibold ${pnlClass(chg)}`}>
          {chg >= 0 ? '+' : ''}
          {chg.toFixed(2)} {chg >= 0 ? '+' : ''}
          {((chg / r.sessionOpen) * 100).toFixed(2)}%
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-up">
          <span className="h-1.5 w-1.5 rounded-full bg-up" /> Market open (simulated)
        </div>
        <div className="mt-4 rounded-lg border border-[#3b2a5c] bg-[#1a1426] p-3 text-[11px]">
          <div className="font-semibold text-[#b47cff]">News · just now</div>
          <div className="mt-1 text-ink/90">Local trader buys {ins.name.toLowerCase()} because the line went up. Analysts call it “a vibe”.</div>
        </div>
        <div className="mt-4 text-[13px] font-semibold">Contract highlights</div>
        <div className="mt-2 space-y-1.5 pb-4 font-mono text-[11px]">
          {[
            ['Session high', price(hi, sym)],
            ['Session low', price(lo, sym)],
            ['Volume', vol.toLocaleString()],
            ['Tick size', `${ins.tick}`],
            ['Point value', money(ins.pointValue)],
            ['Front month', `${sym}${CONTRACT_MONTH}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-mute">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BottomPanel({ acc, onQuick }: { acc?: Account; onQuick: (s: Side) => void }) {
  const [tab, setTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const flatten = useApp((s) => s.flatten);
  const cancelOrder = useApp((s) => s.cancelOrder);
  useMarket((s) => s.simTime);

  const positions = acc ? (Object.entries(acc.positions) as [Sym, NonNullable<Account['positions'][Sym]>][]) : [];
  const upnl = acc ? unrealized(acc) : 0;
  const realized = acc ? acc.balance - acc.dayStartBalance : 0;

  return (
    <div className="h-[250px] shrink-0 border-t border-line bg-[#0d0e10]">
      <div className="flex items-center gap-5 overflow-x-auto border-b border-line px-4 py-2 font-mono text-[11px]">
        <span className="font-semibold text-ink">{acc ? acc.id : 'No account'}</span>
        {acc && (
          <>
            <span className="text-mute">Balance <span className="text-ink">{money(acc.balance, { cents: true })}</span></span>
            <span className="text-mute">Equity <span className="text-ink">{money(equity(acc), { cents: true })}</span></span>
            <span className="text-mute">Realized today <span className={pnlClass(realized)}>{money(realized, { cents: true, sign: true })}</span></span>
            <span className="text-mute">Unrealized <span className={pnlClass(upnl)}>{money(upnl, { cents: true, sign: true })}</span></span>
            <span className="text-mute">MLL <span className="text-down">{money(acc.mll)}</span></span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 px-3 py-2">
        {(
          [
            ['positions', `Positions${positions.length ? ` (${positions.length})` : ''}`],
            ['orders', `Orders${acc?.orders.length ? ` (${acc.orders.length})` : ''}`],
            ['history', 'Trade history'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1 text-[12px] ${tab === k ? 'bg-ink font-semibold text-bg' : 'text-mute hover:bg-panel2'}`}>
            {l}
          </button>
        ))}
        {acc && positions.length > 0 && (
          <Btn className="ml-auto py-1" onClick={() => flatten(acc.id)}>
            Flatten all
          </Btn>
        )}
      </div>
      <div className="h-[160px] overflow-y-auto px-3">
        {tab === 'positions' &&
          (positions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="text-[15px] font-semibold">Make a trade to get started</div>
              <div className="mt-1 text-[12px] text-mute">Buy or sell — choose your pill.</div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-mute">
                <button disabled={!acc} onClick={() => onQuick(-1)} className="rounded-full bg-down px-5 py-1.5 font-semibold text-white disabled:opacity-40">Sell</button>
                or
                <button disabled={!acc} onClick={() => onQuick(1)} className="rounded-full bg-buy px-5 py-1.5 font-semibold text-white disabled:opacity-40">Buy</button>
              </div>
            </div>
          ) : (
            <Table head={['Symbol', 'Side', 'Qty', 'Avg price', 'Last', 'Unrealized P&L', '']}>
              {positions.map(([s, p]) => {
                const qq = quoteFor(s);
                const mark = p.qty > 0 ? qq.bid : qq.ask;
                const u = (mark - p.avg) * p.qty * INSTRUMENTS[s].pointValue;
                return (
                  <tr key={s} className="border-t border-line">
                    <td className="py-1.5 font-semibold">{s}{CONTRACT_MONTH}</td>
                    <td className={p.qty > 0 ? 'text-[#7aa2ff]' : 'text-down'}>{p.qty > 0 ? 'Long' : 'Short'}</td>
                    <td>{Math.abs(p.qty)}</td>
                    <td>{price(p.avg, s)}</td>
                    <td>{price(qq.last, s)}</td>
                    <td className={pnlClass(u)}>{money(u, { cents: true, sign: true })}</td>
                    <td className="text-right">
                      <button onClick={() => flatten(acc!.id, s)} className="rounded border border-line2 px-2 py-0.5 text-[10px] hover:bg-panel2">Close</button>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ))}
        {tab === 'orders' &&
          (!acc?.orders.length ? (
            <div className="py-10 text-center text-[12px] text-dim">No working orders</div>
          ) : (
            <Table head={['Symbol', 'Type', 'Side', 'Qty', 'Price', '']}>
              {acc.orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="py-1.5 font-semibold">{o.sym}{CONTRACT_MONTH}</td>
                  <td>{o.label ?? o.type.toUpperCase()}</td>
                  <td className={o.side === 1 ? 'text-[#7aa2ff]' : 'text-down'}>{o.side === 1 ? 'Buy' : 'Sell'}</td>
                  <td>{o.qty}</td>
                  <td>{price(o.price, o.sym)}</td>
                  <td className="text-right">
                    <button onClick={() => cancelOrder(acc.id, o.id)} className="text-dim hover:text-down">
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          ))}
        {tab === 'history' &&
          (!acc?.trades.length ? (
            <div className="py-10 text-center text-[12px] text-dim">No closed trades yet</div>
          ) : (
            <Table head={['Time', 'Symbol', 'Side', 'Qty', 'Entry', 'Exit', 'P&L']}>
              {[...acc.trades].reverse().map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="py-1.5 text-mute">{new Date(t.closedAt).toLocaleTimeString()}</td>
                  <td className="font-semibold">{t.sym}</td>
                  <td className={t.side === 1 ? 'text-[#7aa2ff]' : 'text-down'}>{t.side === 1 ? 'Long' : 'Short'}</td>
                  <td>{t.qty}</td>
                  <td>{price(t.entry, t.sym)}</td>
                  <td>{price(t.exit, t.sym)}</td>
                  <td className={pnlClass(t.pnl)}>{money(t.pnl, { cents: true, sign: true })}</td>
                </tr>
              ))}
            </Table>
          ))}
      </div>
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full font-mono text-[11px]">
      <thead>
        <tr className="text-left text-dim">
          {head.map((h) => (
            <th key={h} className="pb-1 font-normal">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
