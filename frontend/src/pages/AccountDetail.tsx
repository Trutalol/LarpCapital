import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import BalanceChart from '../components/BalanceChart';
import { Rail } from '../components/AccountBits';
import { Btn, Label, Panel, Tag } from '../components/ui';
import { Account, equity, isoDate, parseIso, useApp } from '../lib/store';
import { planById } from '../lib/plans';
import { duration, money, pnlClass, shortDate } from '../lib/format';
import { consistency, historyRows, totalPnl, tradingDays } from '../lib/stats';
import { useMarket } from '../lib/market';

export default function AccountDetail() {
  const { id } = useParams();
  const accounts = useApp((s) => s.accounts);
  const a = accounts.find((x) => x.id === id);
  const nav = useNavigate();
  const setActive = useApp((s) => s.setActiveAccount);
  useMarket((s) => s.simTime);
  if (!a) return <Navigate to="/accounts" replace />;

  const plan = planById(a.planId);
  const pnl = totalPnl(a);
  const cons = consistency(a);
  const eq = a.status === 'active' ? equity(a) : a.balance;
  const target = a.startBalance + plan.target;

  return (
    <div className="space-y-3 p-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-panel p-1.5 pr-2">
          <button onClick={() => nav('/accounts')} className="rounded-lg border border-line2 p-2 text-mute hover:text-ink">
            <ArrowLeft size={14} />
          </button>
          <span className="font-mono text-[11px] font-semibold text-dim">ACCOUNT</span>
          <div className="relative">
            <select
              value={a.id}
              onChange={(e) => nav(`/accounts/${e.target.value}`)}
              className="appearance-none rounded-lg border border-line2 bg-panel2 py-1.5 pl-3 pr-8 font-mono text-[12px] font-semibold outline-none"
            >
              {accounts.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.id}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-2.5 text-dim" />
          </div>
        </div>
        {a.status === 'active' && (
          <Btn
            tone="blue"
            onClick={() => {
              setActive(a.id);
              nav('/trade');
            }}
          >
            Launch terminal
          </Btn>
        )}
      </div>

      <div className="flex items-center gap-2">
        {a.status === 'breached' && <Tag tone="red">Breached</Tag>}
        {a.status === 'passed' && <Tag tone="green">Passed</Tag>}
        {a.status === 'active' && <Tag tone="green">Active</Tag>}
        <Tag>{a.type === 'eval' ? 'Eval' : 'Funded'}</Tag>
        <span className="text-[14px] font-bold uppercase">{plan.name}</span>
        <span className="font-mono text-[10px] text-dim">{a.id}</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          ['Account balance', money(a.balance), ''],
          ['Minimum balance', money(a.mll), ''],
          ['Total P&L', money(pnl, { sign: true }), pnlClass(pnl)],
          ['Trading days', String(tradingDays(a)), ''],
          ['Consistency', cons === null ? '—' : `${cons.toFixed(2)}%`, cons !== null && cons > 50 ? 'text-down' : ''],
        ].map(([k, v, c]) => (
          <Panel key={k} className="px-4 py-3">
            <Label>{k}</Label>
            <div className={`mt-1 text-lg font-bold ${c}`}>{v}</div>
          </Panel>
        ))}
      </div>

      <Panel className="p-4">
        <div className="flex gap-4 font-mono text-[10px] font-semibold text-dim">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-up" /> BALANCE</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-down" /> MINIMUM</span>
        </div>
        <div className="mt-2 h-[260px]">
          <BalanceChart account={a} />
        </div>
      </Panel>

      <Panel className="px-5 pb-4 pt-1">
        <Rail a={a} live={a.status === 'active'} />
        <div className="mt-3 grid grid-cols-3 border-t border-line pt-3">
          <div>
            <div className="text-lg font-bold">{money(eq - a.mll)}</div>
            <Label>Drawdown left</Label>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-up">{money(eq)}</div>
            <Label>Balance</Label>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{a.type === 'eval' ? money(Math.max(0, target - a.balance)) : money(a.payoutsTotal)}</div>
            <Label>{a.type === 'eval' ? 'Remaining' : 'Paid out'}</Label>
          </div>
        </div>
      </Panel>

      <Calendar a={a} />
      <HistoryTable a={a} />
    </div>
  );
}

function Calendar({ a }: { a: Account }) {
  const sessionDate = useApp((s) => s.sessionDate);
  const [month, setMonth] = useState(() => {
    const d = parseIso(sessionDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const first = month.getDay();
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((first + daysIn) / 7) * 7;
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const monthDays = Object.entries(a.days).filter(([d]) => d.startsWith(isoDate(month).slice(0, 7)));
  const monthPnl = monthDays.reduce((s, [, d]) => s + d.pnl, 0);

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label>Trading calendar</Label>
          <span className={`font-mono text-[12px] font-semibold ${pnlClass(monthPnl)}`}>{money(monthPnl, { sign: true, cents: true })} this month</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded-lg border border-line2 p-2 text-mute hover:text-ink"><ArrowLeft size={13} /></button>
          <span className="w-32 text-center font-mono text-[12px] font-semibold">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => shift(1)} className="rounded-lg border border-line2 p-2 text-mute hover:text-ink"><ArrowRight size={13} /></button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <div key={d} className="rounded bg-panel2 py-1.5 text-center font-mono text-[10px] font-semibold text-mute">{d}</div>
        ))}
        {Array.from({ length: cells }, (_, i) => {
          const n = i - first + 1;
          if (n < 1 || n > daysIn) return <div key={i} className="h-[72px] rounded-lg border border-line/50" />;
          const key = isoDate(new Date(month.getFullYear(), month.getMonth(), n));
          const d = a.days[key];
          const isToday = key === sessionDate;
          const tone = !d ? '' : d.pnl > 0 ? 'border-up/40 bg-up/10' : d.pnl < 0 ? 'border-down/40 bg-down/10' : '';
          return (
            <div key={i} className={`flex h-[72px] flex-col items-center justify-center rounded-lg border ${tone || 'border-line'} ${isToday ? 'ring-1 ring-ink/40' : ''}`}>
              <div className="font-mono text-[12px] font-bold">{n}</div>
              {d && (
                <>
                  <div className={`font-mono text-[11px] font-semibold ${pnlClass(d.pnl)}`}>{money(d.pnl, { sign: true })}</div>
                  <div className="font-mono text-[9px] text-dim">{d.trades} trades</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function HistoryTable({ a }: { a: Account }) {
  const rows = historyRows(a);
  return (
    <Panel className="p-4">
      <div className="flex justify-between">
        <Label>Trading history</Label>
        <span className="font-mono text-[10px] text-dim">{rows.length} records</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr className="bg-panel2 text-left text-[10px] text-dim">
              {['Date', 'Symbol', 'Net PnL', 'PnL high', 'PnL low', 'Qty', 'Commission', 'Avg win', 'Avg loss', 'Win duration', 'Loss duration', 'Win %'].map((h) => (
                <th key={h} className="px-2 py-2 font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="py-8 text-center text-dim">No trades on this account yet</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.day + r.sym} className="border-t border-line">
                <td className="px-2 py-2.5 font-semibold">{shortDate(r.day)}</td>
                <td className="px-2"><Tag>{r.sym}Z6</Tag></td>
                <td className={`px-2 ${pnlClass(r.net)}`}>{money(r.net, { cents: true })}</td>
                <td className="px-2">{money(r.high, { cents: true })}</td>
                <td className="px-2">{money(r.low, { cents: true })}</td>
                <td className="px-2">{r.qty}</td>
                <td className="px-2">{money(r.commission, { cents: true })}</td>
                <td className="px-2">{r.avgWin === null ? '—' : money(r.avgWin)}</td>
                <td className="px-2">{r.avgLoss === null ? '—' : money(r.avgLoss)}</td>
                <td className="px-2">{r.winDur === null ? '—' : duration(r.winDur)}</td>
                <td className="px-2">{r.lossDur === null ? '—' : duration(r.lossDur)}</td>
                <td className="px-2">
                  <span className={`rounded border px-1.5 py-0.5 ${r.winPct >= 50 ? 'border-up/40 bg-up/10 text-up' : 'border-down/40 bg-down/10 text-down'}`}>{r.winPct.toFixed(2)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
