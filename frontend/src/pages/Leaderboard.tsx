import { useState } from 'react';
import { Crown } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Panel, Tag } from '../components/ui';
import { useApp } from '../lib/store';
import { money, pnlClass } from '../lib/format';
import { totalPnl } from '../lib/stats';

// Placeholder rivals until the backend tracks every hackathon trader.
const RIVALS = [
  { name: 'diamondhands_dev', pnl: 18420, payouts: 9200, funded: 3, winRate: 61 },
  { name: 'ramen_capital', pnl: 12950, payouts: 6100, funded: 2, winRate: 58 },
  { name: 'stoploss_skipper', pnl: 9780, payouts: 4400, funded: 2, winRate: 47 },
  { name: 'theta_gang_intern', pnl: 6315, payouts: 2500, funded: 1, winRate: 66 },
  { name: 'candle_whisperer', pnl: 4120, payouts: 1800, funded: 1, winRate: 52 },
  { name: 'vwap_or_nothing', pnl: 2240, payouts: 0, funded: 1, winRate: 55 },
  { name: 'revenge_trader_99', pnl: -3890, payouts: 0, funded: 0, winRate: 31 },
  { name: 'buy_high_sell_low', pnl: -7120, payouts: 0, funded: 0, winRate: 22 },
];

export default function Leaderboard() {
  const accounts = useApp((s) => s.accounts);
  const payouts = useApp((s) => s.payouts);
  const name = useApp((s) => s.profile.name);
  const [sort, setSort] = useState<'pnl' | 'payouts'>('pnl');

  const trades = accounts.flatMap((a) => a.trades);
  const me = {
    name,
    pnl: accounts.reduce((s, a) => s + totalPnl(a), 0),
    payouts: payouts.reduce((s, p) => s + p.net, 0),
    funded: accounts.filter((a) => a.type === 'funded').length,
    winRate: trades.length ? Math.round((trades.filter((t) => t.pnl >= 0).length / trades.length) * 100) : 0,
    me: true,
  };
  const rows = [...RIVALS.map((r) => ({ ...r, me: false })), me].sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="pb-16">
      <PageHeader title="LEADERBOARD" subtitle="LarpHacks trading floor — ranked by how good they're pretending to be." />
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
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-[12px] font-bold uppercase">Rankings</span>
            <div className="flex rounded-lg border border-line p-0.5">
              {(['pnl', 'payouts'] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)} className={`rounded-md px-3 py-1 text-[11px] font-semibold ${sort === s ? 'bg-panel2 text-ink' : 'text-mute'}`}>
                  {s === 'pnl' ? 'P&L' : 'Payouts'}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full font-mono text-[12px]">
            <thead>
              <tr className="border-t border-line text-left text-[10px] uppercase text-dim">
                {['Rank', 'Trader', 'Total P&L', 'Payouts', 'Funded accts', 'Win rate'].map((h) => (
                  <th key={h} className="px-5 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.name} className={`border-t border-line ${r.me ? 'bg-up/5' : ''}`}>
                  <td className="px-5 py-3 text-dim">{i + 1}</td>
                  <td className="px-5 font-semibold">
                    {r.name} {r.me && <Tag tone="green">you</Tag>}
                  </td>
                  <td className={`px-5 ${pnlClass(r.pnl)}`}>{money(r.pnl, { sign: true })}</td>
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
