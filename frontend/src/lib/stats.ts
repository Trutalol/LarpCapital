import { Sym } from './instruments';
import { Account } from './store';

export const totalPnl = (a: Account) => a.balance - a.startBalance + a.payoutsTotal;

export const tradingDays = (a: Account) => Object.values(a.days).filter((d) => d.trades > 0).length;

/** Best single day as a share of total profit (lower is more "consistent"). */
export function consistency(a: Account) {
  const total = totalPnl(a);
  const best = Math.max(0, ...Object.values(a.days).map((d) => d.pnl));
  if (total <= 0 || best <= 0) return null;
  return (best / total) * 100;
}

export interface HistoryRow {
  day: string;
  sym: Sym;
  net: number;
  high: number;
  low: number;
  qty: number;
  commission: number;
  avgWin: number | null;
  avgLoss: number | null;
  winDur: number | null;
  lossDur: number | null;
  winPct: number;
}

export function historyRows(a: Account): HistoryRow[] {
  const groups = new Map<string, { day: string; sym: Sym }>();
  for (const f of a.fills) groups.set(`${f.day}|${f.sym}`, { day: f.day, sym: f.sym });
  const rows: HistoryRow[] = [];
  for (const { day, sym } of groups.values()) {
    const fills = a.fills.filter((f) => f.day === day && f.sym === sym);
    const trades = a.trades.filter((t) => t.day === day && t.sym === sym);
    const commission = fills.reduce((s, f) => s + f.commission, 0);
    let run = 0;
    let high = 0;
    let low = 0;
    for (const t of trades) {
      run += t.pnl;
      high = Math.max(high, run);
      low = Math.min(low, run);
    }
    const wins = trades.filter((t) => t.pnl >= 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    rows.push({
      day,
      sym,
      net: run - commission,
      high,
      low,
      qty: fills.reduce((s, f) => s + f.qty, 0),
      commission,
      avgWin: avg(wins.map((t) => t.pnl)),
      avgLoss: avg(losses.map((t) => t.pnl)),
      winDur: avg(wins.map((t) => t.closedAt - t.openedAt)),
      lossDur: avg(losses.map((t) => t.closedAt - t.openedAt)),
      winPct: trades.length ? (wins.length / trades.length) * 100 : 0,
    });
  }
  return rows.sort((x, y) => (x.day < y.day ? 1 : -1));
}
