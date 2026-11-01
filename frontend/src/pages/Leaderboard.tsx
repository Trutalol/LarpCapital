import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Crown, LocateFixed } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Panel, Tag } from '../components/ui';
import { useApp } from '../lib/store';
import { money, pnlClass } from '../lib/format';
import { totalPnl } from '../lib/stats';
import { TICK_MS, useRivals, winRate } from '../lib/rivals';

function LiveBadge({ lastTick }: { lastTick: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ago = Math.max(0, Math.floor((now - lastTick) / 1000));
  const next = Math.max(0, Math.ceil((lastTick + TICK_MS - now) / 1000));
  return (
    <span className="flex items-center gap-2 font-mono text-[10px] text-mute">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
      </span>
      LIVE · updated {ago}s ago · next in {next}s
    </span>
  );
}

function RankMove({ delta }: { delta: number }) {
  if (!delta) return null;
  const up = delta > 0;
  return (
    <span className={`ml-1.5 inline-flex items-center text-[10px] ${up ? 'text-up' : 'text-down'}`}>
      {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {Math.abs(delta)}
    </span>
  );
}

export default function Leaderboard() {
  const accounts = useApp((s) => s.accounts);
  const payouts = useApp((s) => s.payouts);
  const name = useApp((s) => s.profile.name);
  const rivals = useRivals((s) => s.rivals);
  const lastTick = useRivals((s) => s.lastTick);
  const [sort, setSort] = useState<'pnl' | 'payouts'>('pnl');
  const meRow = useRef<HTMLTableRowElement>(null);

  const trades = accounts.flatMap((a) => a.trades);
  const me = {
    name,
    pnl: accounts.reduce((s, a) => s + totalPnl(a), 0),
    payouts: payouts.reduce((s, p) => s + p.net, 0),
    funded: accounts.filter((a) => a.type === 'funded').length,
    winRate: trades.length ? Math.round((trades.filter((t) => t.pnl >= 0).length / trades.length) * 100) : 0,
    last: 0,
    me: true,
  };
  const rows = [...rivals.map((r) => ({ name: r.name, pnl: r.pnl, payouts: r.payouts, funded: r.funded, winRate: winRate(r), last: r.last, me: false })), me].sort(
    (a, b) => b[sort] - a[sort],
  );
  const ranks = new Map(rows.map((r, i) => [r.name, i]));
  const myRank = ranks.get(name)! + 1;

  // Rank arrows compare against the ranking from before the latest rival tick.
  const snap = useRef({ tick: lastTick, sort, prev: ranks, cur: ranks });
  if (snap.current.tick !== lastTick || snap.current.sort !== sort) {
    snap.current = { tick: lastTick, sort, prev: snap.current.sort === sort ? snap.current.cur : ranks, cur: ranks };
  } else {
    snap.current.cur = ranks;
  }
  const prev = snap.current.prev;

  return (
    <div className="pb-16">
      <PageHeader title="LEADERBOARD" subtitle="Live trader rankings, updated every minute." />
      <div className="mx-10 mt-8">
        <div className="mb-4 grid grid-cols-3 gap-4">
          {rows.slice(0, 3).map((r, i) => (
            <Panel key={r.name} className={`p-5 ${i === 0 ? 'border-warn/40 shadow-[0_0_40px_rgba(245,184,61,0.08)]' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold text-dim">#{i + 1}</span>
                {i === 0 && <Crown size={20} className="text-warn" />}
              </div>
              <div className="mt-3 text-[15px] font-bold">
                {r.name} {r.me && <Tag tone="green">you</Tag>}
              </div>
              <div className={`mt-1 font-mono text-xl font-semibold ${pnlClass(r[sort])}`}>{money(r[sort], { sign: sort === 'pnl' })}</div>
              <div className="font-mono text-[10px] text-dim">{sort === 'pnl' ? 'total P&L' : 'total payouts'}</div>
            </Panel>
          ))}
        </div>
        <Panel>
          <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-bold uppercase">Rankings</span>
              <LiveBadge lastTick={lastTick} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => meRow.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-mute hover:text-ink"
              >
                <LocateFixed size={12} /> Find me (#{myRank})
              </button>
              <div className="flex rounded-lg border border-line p-0.5">
                {(['pnl', 'payouts'] as const).map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`rounded-md px-3 py-1 text-[11px] font-semibold ${sort === s ? 'bg-panel2 text-ink' : 'text-mute'}`}>
                    {s === 'pnl' ? 'P&L' : 'Payouts'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <table className="w-full font-mono text-[12px]">
            <thead>
              <tr className="border-t border-line text-left text-[10px] uppercase text-dim">
                {['Rank', 'Trader', 'Total P&L', 'Last 1m', 'Payouts', 'Funded accts', 'Win rate'].map((h) => (
                  <th key={h} className="px-5 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.me ? `${r.name}-me` : `${r.name}-${lastTick}`}
                  ref={r.me ? meRow : undefined}
                  className={`border-t border-line ${r.me ? 'bg-up/5' : r.last > 0 ? 'flash-up' : r.last < 0 ? 'flash-down' : ''}`}
                >
                  <td className="whitespace-nowrap px-5 py-3 text-dim">
                    {i + 1}
                    <RankMove delta={(prev.get(r.name) ?? i) - i} />
                  </td>
                  <td className="px-5 font-semibold">
                    {r.name} {r.me && <Tag tone="green">you</Tag>}
                  </td>
                  <td className={`px-5 ${pnlClass(r.pnl)}`}>{money(r.pnl, { sign: true })}</td>
                  <td className={`px-5 ${pnlClass(r.last)}`}>{r.me ? '' : r.last ? money(r.last, { sign: true }) : '·'}</td>
                  <td className="px-5 text-up">{money(r.payouts)}</td>
                  <td className="px-5">{r.funded}</td>
                  <td className="px-5">{r.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
