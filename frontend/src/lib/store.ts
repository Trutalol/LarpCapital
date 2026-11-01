import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INSTRUMENTS, Sym, miniEquivalent, roundToTick } from './instruments';
import { planById } from './plans';
import { quoteFor, useMarket } from './market';

export type Side = 1 | -1;

export interface Position {
  qty: number; // signed
  avg: number;
  openedAt: number;
}

export interface Order {
  id: string;
  sym: Sym;
  side: Side;
  type: 'limit' | 'stop';
  qty: number;
  price: number;
  reduceOnly: boolean;
  oco?: string;
  tpTicks?: number;
  slTicks?: number;
  label?: string;
  createdAt: number;
}

export interface Fill {
  id: string;
  sym: Sym;
  side: Side;
  qty: number;
  price: number;
  commission: number;
  time: number;
  day: string;
}

export interface Trade {
  id: string;
  sym: Sym;
  side: Side; // direction of the position that was closed
  qty: number;
  entry: number;
  exit: number;
  pnl: number; // gross
  openedAt: number;
  closedAt: number;
  day: string;
}

export interface DayStat {
  pnl: number; // net of commission
  trades: number;
  wins: number;
  losses: number;
  commission: number;
}

export type AccountStatus = 'active' | 'breached' | 'passed';

export interface Account {
  id: string;
  planId: string;
  type: 'eval' | 'funded';
  status: AccountStatus;
  statusReason?: string;
  createdAt: number;
  closedAt?: number;
  parentId?: string;
  startBalance: number;
  balance: number;
  mll: number;
  peak: number;
  mllLocked: boolean;
  dayStartBalance: number;
  positions: Partial<Record<Sym, Position>>;
  orders: Order[];
  fills: Fill[];
  trades: Trade[];
  days: Record<string, DayStat>;
  history: { t: number; balance: number; mll: number }[];
  payoutsTotal: number;
  resets: number;
}

export interface Payout {
  id: string;
  accountId: string;
  planName: string;
  gross: number;
  net: number;
  status: 'processing' | 'paid';
  requestedAt: number;
  paidAt?: number;
  certId?: string;
}

export interface Certificate {
  id: string;
  kind: 'funded' | 'payout';
  name: string;
  title: string;
  amount?: number;
  date: number;
  accountId: string;
}

export interface AppEvent {
  id: string;
  kind: 'breach' | 'pass' | 'payout' | 'toast' | 'error';
  title: string;
  body?: string;
  accountId?: string;
  certId?: string;
}

export interface OrderTicket {
  sym: Sym;
  side: Side;
  type: 'market' | 'limit' | 'stop';
  qty: number;
  price?: number;
  tpTicks?: number;
  slTicks?: number;
}

interface AppState {
  profile: { name: string; verified: boolean };
  accounts: Account[];
  payouts: Payout[];
  certificates: Certificate[];
  sessionDate: string;
  seq: number;
  events: AppEvent[];
  activeAccountId: string | null;

  addAccount: (planId: string) => string;
  resetAccount: (id: string) => void;
  setActiveAccount: (id: string) => void;
  placeOrder: (accountId: string, t: OrderTicket) => void;
  cancelOrder: (accountId: string, orderId: string) => void;
  flatten: (accountId: string, sym?: Sym) => void;
  processTick: () => void;
  settleDay: () => void;
  requestPayout: (accountId: string, gross: number) => void;
  setName: (name: string) => void;
  setVerified: (v: boolean) => void;
  dismissEvent: (id: string) => void;
  resetAll: () => void;
}

// ---------- helpers ----------

const uid = () => Math.random().toString(36).slice(2, 10);

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function nextWeekday(s: string, skipToday: boolean) {
  const d = parseIso(s);
  if (skipToday) d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return isoDate(d);
}

export function unrealized(acc: Account) {
  let u = 0;
  for (const [sym, p] of Object.entries(acc.positions) as [Sym, Position][]) {
    const q = quoteFor(sym);
    const mark = p.qty > 0 ? q.bid : q.ask;
    u += (mark - p.avg) * p.qty * INSTRUMENTS[sym].pointValue;
  }
  return u;
}

export const equity = (acc: Account) => acc.balance + unrealized(acc);

function newAccount(planId: string, type: 'eval' | 'funded', id: string, parentId?: string): Account {
  const plan = planById(planId);
  const now = Date.now();
  return {
    id,
    planId,
    type,
    status: 'active',
    createdAt: now,
    parentId,
    startBalance: plan.size,
    balance: plan.size,
    mll: plan.size - plan.drawdown,
    peak: plan.size,
    mllLocked: false,
    dayStartBalance: plan.size,
    positions: {},
    orders: [],
    fills: [],
    trades: [],
    days: {},
    history: [{ t: now, balance: plan.size, mll: plan.size - plan.drawdown }],
    payoutsTotal: 0,
    resets: 0,
  };
}

function accountId(type: 'eval' | 'funded', seq: number) {
  const d = new Date();
  const stamp = `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getFullYear()).slice(2)}`;
  return `${type === 'eval' ? 'LCE' : 'LCF'}${stamp}${String(seq).padStart(6, '0')}`;
}

function day(acc: Account, date: string): DayStat {
  return (acc.days[date] ??= { pnl: 0, trades: 0, wins: 0, losses: 0, commission: 0 });
}

function pushHistory(acc: Account) {
  const last = acc.history[acc.history.length - 1];
  const t = Math.max(Date.now(), (last?.t ?? 0) + 1000);
  acc.history.push({ t, balance: acc.balance, mll: acc.mll });
}

/** Execute a fill against a draft account (mutates). */
function applyFill(acc: Account, sym: Sym, side: Side, qty: number, price: number, date: string) {
  const ins = INSTRUMENTS[sym];
  const now = Date.now();
  const commission = ins.commission * qty;
  acc.balance -= commission;
  const d = day(acc, date);
  d.commission += commission;
  d.pnl -= commission;
  acc.fills.push({ id: uid(), sym, side, qty, price, commission, time: now, day: date });

  const pos = acc.positions[sym];
  if (!pos || Math.sign(pos.qty) === side) {
    const prevQty = pos ? Math.abs(pos.qty) : 0;
    const newQty = prevQty + qty;
    acc.positions[sym] = {
      qty: side * newQty,
      avg: ((pos ? pos.avg * prevQty : 0) + price * qty) / newQty,
      openedAt: pos?.openedAt ?? now,
    };
    return;
  }

  const closing = Math.min(qty, Math.abs(pos.qty));
  const dir = Math.sign(pos.qty) as Side;
  const pnl = (price - pos.avg) * dir * closing * ins.pointValue;
  acc.balance += pnl;
  d.pnl += pnl;
  d.trades += 1;
  if (pnl >= 0) d.wins += 1;
  else d.losses += 1;
  acc.trades.push({ id: uid(), sym, side: dir, qty: closing, entry: pos.avg, exit: price, pnl, openedAt: pos.openedAt, closedAt: now, day: date });

  const remaining = qty - closing;
  const left = pos.qty + side * closing;
  if (left === 0) delete acc.positions[sym];
  else acc.positions[sym] = { ...pos, qty: left };
  if (remaining > 0) acc.positions[sym] = { qty: side * remaining, avg: price, openedAt: now };

  if (!acc.positions[sym]) acc.orders = acc.orders.filter((o) => !(o.sym === sym && o.reduceOnly));
  pushHistory(acc);
}

function exposureAfter(acc: Account, sym: Sym, side: Side, qty: number) {
  let total = 0;
  for (const [s, p] of Object.entries(acc.positions) as [Sym, Position][]) {
    const q = s === sym ? p.qty + side * qty : p.qty;
    total += miniEquivalent(s, q);
  }
  if (!acc.positions[sym]) total += miniEquivalent(sym, qty);
  return total;
}

function marketPrice(sym: Sym, side: Side) {
  const q = quoteFor(sym);
  return side === 1 ? q.ask : q.bid;
}

function flattenDraft(acc: Account, date: string, sym?: Sym) {
  for (const [s, p] of Object.entries(acc.positions) as [Sym, Position][]) {
    if (sym && s !== sym) continue;
    const side = (p.qty > 0 ? -1 : 1) as Side;
    applyFill(acc, s, side, Math.abs(p.qty), marketPrice(s, side), date);
  }
  acc.orders = sym ? acc.orders.filter((o) => o.sym !== sym) : [];
}

function attachBracket(acc: Account, sym: Sym, side: Side, qty: number, fillPrice: number, tpTicks?: number, slTicks?: number) {
  if (!tpTicks && !slTicks) return;
  const tick = INSTRUMENTS[sym].tick;
  const oco = uid();
  const exitSide = (-side) as Side;
  const now = Date.now();
  if (tpTicks) {
    acc.orders.push({ id: uid(), sym, side: exitSide, type: 'limit', qty, price: roundToTick(fillPrice + side * tpTicks * tick, tick), reduceOnly: true, oco, label: 'TP', createdAt: now });
  }
  if (slTicks) {
    acc.orders.push({ id: uid(), sym, side: exitSide, type: 'stop', qty, price: roundToTick(fillPrice - side * slTicks * tick, tick), reduceOnly: true, oco, label: 'SL', createdAt: now });
  }
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface Outcome {
  events: AppEvent[];
  funded?: Account;
  cert?: Certificate;
}

/** After any change: check pass / breach rules. Mutates draft, returns side effects. */
function checkRules(acc: Account, date: string, name: string, nextFundedId: () => string): Outcome {
  const out: Outcome = { events: [] };
  if (acc.status !== 'active') return out;
  const plan = planById(acc.planId);
  const eq = equity(acc);

  if (plan.drawdownType === 'INTRADAY' && !acc.mllLocked && eq > acc.peak) {
    acc.peak = eq;
    acc.mll = Math.min(acc.startBalance, Math.max(acc.mll, roundToTick(eq - plan.drawdown, 1)));
    if (acc.mll >= acc.startBalance) acc.mllLocked = true;
  }

  let breach: string | null = null;
  if (eq <= acc.mll) breach = `Equity ${fmt(eq)} hit the max loss limit of ${fmt(acc.mll)}.`;
  else if (plan.dll && eq - acc.dayStartBalance <= -plan.dll) breach = `Down ${fmt(acc.dayStartBalance - eq)} today, past the ${fmt(plan.dll)} daily loss limit.`;

  if (breach) {
    flattenDraft(acc, date);
    acc.status = 'breached';
    acc.statusReason = breach;
    acc.closedAt = Date.now();
    out.events.push({ id: uid(), kind: 'breach', title: 'ACCOUNT BREACHED', body: breach, accountId: acc.id });
    return out;
  }

  if (acc.type === 'eval' && acc.balance >= acc.startBalance + plan.target) {
    flattenDraft(acc, date);
    acc.status = 'passed';
    acc.statusReason = `Profit target of ${fmt(plan.target)} reached.`;
    acc.closedAt = Date.now();
    const funded = newAccount(acc.planId, 'funded', nextFundedId(), acc.id);
    const cert: Certificate = { id: uid(), kind: 'funded', name, title: plan.name, date: Date.now(), accountId: funded.id };
    out.funded = funded;
    out.cert = cert;
    out.events.push({ id: uid(), kind: 'pass', title: "YOU'RE FUNDED", body: `${plan.name} evaluation passed. Funded account ${funded.id} is live.`, accountId: funded.id, certId: cert.id });
  }
  return out;
}

const initialDate = () => nextWeekday(isoDate(new Date()), false);

const initial = () => ({
  profile: { name: 'Trader', verified: false },
  accounts: [] as Account[],
  payouts: [] as Payout[],
  certificates: [] as Certificate[],
  sessionDate: initialDate(),
  seq: 1,
  events: [] as AppEvent[],
  activeAccountId: null as string | null,
});

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      /** Run a mutation on a cloned account, then apply rule side effects. */
      const mutate = (accountId: string, fn: (acc: Account, date: string) => AppEvent[] | void) => {
        const s = get();
        const idx = s.accounts.findIndex((a) => a.id === accountId);
        if (idx < 0) return;
        const acc = structuredClone(s.accounts[idx]);
        let seq = s.seq;
        const evs = fn(acc, s.sessionDate) ?? [];
        const out = checkRules(acc, s.sessionDate, s.profile.name, () => accountId_(seq++));
        const accounts = [...s.accounts];
        accounts[idx] = acc;
        if (out.funded) accounts.unshift(out.funded);
        set({
          accounts,
          seq,
          certificates: out.cert ? [out.cert, ...s.certificates] : s.certificates,
          events: [...s.events, ...evs, ...out.events],
          activeAccountId: out.funded ? out.funded.id : s.activeAccountId,
        });
      };
      const accountId_ = (seq: number) => accountId('funded', seq);

      return {
        ...initial(),

        addAccount: (planId) => {
          const s = get();
          const acc = newAccount(planId, 'eval', accountId('eval', s.seq));
          set({ accounts: [acc, ...s.accounts], seq: s.seq + 1, activeAccountId: acc.id });
          return acc.id;
        },

        resetAccount: (id) => {
          const s = get();
          set({
            accounts: s.accounts.map((a) => (a.id === id ? { ...newAccount(a.planId, a.type, a.id), resets: a.resets + 1 } : a)),
            activeAccountId: id,
          });
        },

        setActiveAccount: (id) => set({ activeAccountId: id }),

        placeOrder: (accountId, t) =>
          mutate(accountId, (acc, date) => {
            if (acc.status !== 'active') return [{ id: uid(), kind: 'error', title: 'Account is not active' }];
            const plan = planById(acc.planId);
            if (t.qty <= 0 || !Number.isFinite(t.qty)) return [{ id: uid(), kind: 'error', title: 'Invalid quantity' }];
            if (exposureAfter(acc, t.sym, t.side, t.qty) > plan.maxMinis + 1e-9) {
              return [{ id: uid(), kind: 'error', title: 'Max position size exceeded', body: `${plan.name} allows ${plan.maxMinis} minis (${plan.maxMinis * 10} micros).` }];
            }
            if (t.type === 'market') {
              const px = marketPrice(t.sym, t.side);
              applyFill(acc, t.sym, t.side, t.qty, px, date);
              attachBracket(acc, t.sym, t.side, t.qty, px, t.tpTicks, t.slTicks);
              return [{ id: uid(), kind: 'toast', title: `${t.side === 1 ? 'Bought' : 'Sold'} ${t.qty} ${t.sym} @ ${px.toFixed(INSTRUMENTS[t.sym].decimals)}` }];
            }
            acc.orders.push({ id: uid(), sym: t.sym, side: t.side, type: t.type, qty: t.qty, price: roundToTick(t.price!, INSTRUMENTS[t.sym].tick), reduceOnly: false, tpTicks: t.tpTicks, slTicks: t.slTicks, createdAt: Date.now() });
            return [{ id: uid(), kind: 'toast', title: `${t.type.toUpperCase()} ${t.side === 1 ? 'buy' : 'sell'} ${t.qty} ${t.sym} working @ ${t.price}` }];
          }),

        cancelOrder: (accountId, orderId) =>
          mutate(accountId, (acc) => {
            acc.orders = acc.orders.filter((o) => o.id !== orderId);
          }),

        flatten: (accountId, sym) =>
          mutate(accountId, (acc, date) => {
            flattenDraft(acc, date, sym);
          }),

        processTick: () => {
          const s = get();
          let changed = false;
          let seq = s.seq;
          const newEvents: AppEvent[] = [];
          const newCerts: Certificate[] = [];
          const newAccounts: Account[] = [];
          let activeAccountId = s.activeAccountId;

          const accounts = s.accounts.map((a) => {
            if (a.status !== 'active') return a;
            const hasPos = Object.keys(a.positions).length > 0;
            if (!hasPos && a.orders.length === 0) return a;
            const plan = planById(a.planId);
            // cheap pre-check: does anything need to happen?
            const eq = equity(a);
            const wantsPeak = plan.drawdownType === 'INTRADAY' && !a.mllLocked && eq > a.peak;
            const breachy = eq <= a.mll || (plan.dll !== null && eq - a.dayStartBalance <= -plan.dll);
            const triggers = a.orders.filter((o) => {
              const q = quoteFor(o.sym);
              if (o.type === 'limit') return o.side === 1 ? q.ask <= o.price : q.bid >= o.price;
              return o.side === 1 ? q.ask >= o.price : q.bid <= o.price;
            });
            if (!wantsPeak && !breachy && triggers.length === 0) return a;

            changed = true;
            const acc = structuredClone(a);
            const cancelled = new Set<string>();
            for (const o of triggers) {
              if (cancelled.has(o.id) || !acc.orders.find((x) => x.id === o.id)) continue;
              acc.orders = acc.orders.filter((x) => x.id !== o.id);
              if (o.oco) acc.orders.filter((x) => x.oco === o.oco).forEach((x) => cancelled.add(x.id));
              acc.orders = acc.orders.filter((x) => !cancelled.has(x.id));
              let qty = o.qty;
              if (o.reduceOnly) {
                const p = acc.positions[o.sym];
                if (!p || Math.sign(p.qty) === o.side) continue;
                qty = Math.min(qty, Math.abs(p.qty));
              } else if (exposureAfter(acc, o.sym, o.side, qty) > plan.maxMinis + 1e-9) {
                newEvents.push({ id: uid(), kind: 'error', title: 'Order rejected: max position size' });
                continue;
              }
              const q = quoteFor(o.sym);
              const px = o.type === 'limit' ? o.price : o.side === 1 ? q.ask : q.bid;
              applyFill(acc, o.sym, o.side, qty, px, s.sessionDate);
              if (!o.reduceOnly) attachBracket(acc, o.sym, o.side, qty, px, o.tpTicks, o.slTicks);
              newEvents.push({ id: uid(), kind: 'toast', title: `${o.label ?? o.type.toUpperCase()} filled: ${o.side === 1 ? 'bought' : 'sold'} ${qty} ${o.sym} @ ${px.toFixed(INSTRUMENTS[o.sym].decimals)}` });
            }
            const out = checkRules(acc, s.sessionDate, s.profile.name, () => accountId('funded', seq++));
            newEvents.push(...out.events);
            if (out.cert) newCerts.push(out.cert);
            if (out.funded) {
              newAccounts.push(out.funded);
              activeAccountId = out.funded.id;
            }
            return acc;
          });

          // finish "processing" payouts after a short dramatic pause
          let payouts = s.payouts;
          if (payouts.some((p) => p.status === 'processing' && Date.now() - p.requestedAt > 2500)) {
            changed = true;
            payouts = payouts.map((p) => {
              if (p.status !== 'processing' || Date.now() - p.requestedAt <= 2500) return p;
              const cert: Certificate = { id: uid(), kind: 'payout', name: s.profile.name, title: p.planName, amount: p.net, date: Date.now(), accountId: p.accountId };
              newCerts.push(cert);
              newEvents.push({ id: uid(), kind: 'payout', title: 'PAYOUT APPROVED', body: `${fmt(p.net)} is on its way (to your imagination).`, accountId: p.accountId, certId: cert.id });
              return { ...p, status: 'paid' as const, paidAt: Date.now(), certId: cert.id };
            });
          }

          if (!changed) return;
          set({
            accounts: [...newAccounts, ...accounts],
            seq,
            payouts,
            certificates: [...newCerts, ...s.certificates],
            events: [...s.events, ...newEvents],
            activeAccountId,
          });
        },

        settleDay: () => {
          const s = get();
          const date = s.sessionDate;
          let seq = s.seq;
          const events: AppEvent[] = [];
          const certs: Certificate[] = [];
          const created: Account[] = [];
          const accounts = s.accounts.map((a) => {
            if (a.status !== 'active') return a;
            const acc = structuredClone(a);
            flattenDraft(acc, date);
            const plan = planById(acc.planId);
            if (plan.drawdownType === 'EOD' && !acc.mllLocked) {
              acc.mll = Math.min(acc.startBalance, Math.max(acc.mll, acc.balance - plan.drawdown));
              if (acc.mll >= acc.startBalance) acc.mllLocked = true;
            }
            acc.dayStartBalance = acc.balance;
            pushHistory(acc);
            const out = checkRules(acc, date, s.profile.name, () => accountId('funded', seq++));
            events.push(...out.events);
            if (out.cert) certs.push(out.cert);
            if (out.funded) created.push(out.funded);
            return acc;
          });
          events.push({ id: uid(), kind: 'toast', title: `Session ${date} settled`, body: 'Positions flattened, drawdowns updated.' });
          set({
            accounts: [...created, ...accounts],
            seq,
            certificates: [...certs, ...s.certificates],
            events: [...s.events, ...events],
            sessionDate: nextWeekday(date, true),
          });
        },

        requestPayout: (accountId, gross) => {
          const s = get();
          const acc = s.accounts.find((a) => a.id === accountId);
          if (!acc) return;
          const plan = planById(acc.planId);
          const available = acc.balance - acc.startBalance;
          const err = (title: string) => set({ events: [...s.events, { id: uid(), kind: 'error', title }] });
          if (acc.type !== 'funded' || acc.status !== 'active') return err('Only active funded accounts can request payouts');
          if (Object.keys(acc.positions).length) return err('Close open positions before requesting a payout');
          if (gross < plan.minPayout) return err(`Minimum payout is ${fmt(plan.minPayout)}`);
          if (gross > available + 1e-6) return err(`Max available is ${fmt(available)}`);

          const updated = structuredClone(acc);
          updated.balance -= gross;
          updated.payoutsTotal += gross;
          // a payout starts a fresh drawdown cycle from the new balance
          updated.mll = updated.balance - plan.drawdown;
          updated.peak = updated.balance;
          updated.mllLocked = false;
          updated.dayStartBalance = Math.min(updated.dayStartBalance, updated.balance);
          pushHistory(updated);
          const payout: Payout = { id: uid(), accountId, planName: plan.name, gross, net: Math.round(gross * plan.payoutSplit * 100) / 100, status: 'processing', requestedAt: Date.now() };
          set({
            accounts: s.accounts.map((a) => (a.id === accountId ? updated : a)),
            payouts: [payout, ...s.payouts],
            events: [...s.events, { id: uid(), kind: 'toast', title: 'Payout requested', body: 'The risk desk is pretending to review it…' }],
          });
        },

        setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),
        setVerified: (verified) => set((s) => ({ profile: { ...s.profile, verified } })),
        dismissEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
        resetAll: () => set(initial()),
      };
    },
    {
      name: 'larpcapital-v1',
      partialize: ({ events: _events, ...rest }) => rest,
    },
  ),
);

// Drive the market + rule engine from one loop.
let loop: number | undefined;
export function startEngine() {
  if (loop) return;
  loop = window.setInterval(() => {
    useMarket.getState().tick();
    useApp.getState().processTick();
  }, 250);
}

export function xpFor(s: Pick<AppState, 'accounts' | 'payouts'>) {
  const trades = s.accounts.reduce((n, a) => n + a.trades.length, 0);
  const passes = s.accounts.filter((a) => a.status === 'passed').length;
  const xp = trades * 15 + passes * 600 + s.payouts.length * 900;
  const level = Math.floor(Math.sqrt(xp / 120)) + 1;
  const floor = (level - 1) ** 2 * 120;
  const ceil = level ** 2 * 120;
  return { xp, level, progress: (xp - floor) / (ceil - floor) };
}

if (import.meta.env.DEV) Object.assign(window, { __app: useApp, __market: useMarket });
