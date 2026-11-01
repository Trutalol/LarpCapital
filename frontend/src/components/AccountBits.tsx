import { useNavigate } from 'react-router-dom';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Account, equity, useApp } from '../lib/store';
import { planById } from '../lib/plans';
import { money } from '../lib/format';
import { consistency, totalPnl, tradingDays } from '../lib/stats';
import { useMarket } from '../lib/market';
import { Btn, Label, Tag } from './ui';

export function StatusTags({ a }: { a: Account }) {
  const plan = planById(a.planId);
  return (
    <div className="flex flex-wrap gap-1.5">
      <Tag>{plan.drawdownType === 'EOD' ? 'EOD Drawdown' : 'Intraday Trailing'}</Tag>
      {a.status === 'breached' && <Tag tone="red">Breached</Tag>}
      {a.status === 'passed' && <Tag tone="green">Passed</Tag>}
      {a.status === 'active' && <Tag tone="green">Active</Tag>}
      {plan.dll ? <Tag tone="amber">DLL {money(plan.dll)}</Tag> : <Tag tone="blue">No DLL</Tag>}
    </div>
  );
}

/** Rail from MLL (left) to profit target (right) with the start and current balance marked. */
export function Rail({ a, live = true }: { a: Account; live?: boolean }) {
  useMarket((s) => (live ? s.simTime : 0));
  const plan = planById(a.planId);
  const target = a.type === 'eval' ? a.startBalance + plan.target : Math.max(a.balance, a.startBalance) + plan.target;
  const bal = a.status === 'active' ? equity(a) : a.balance;
  const span = target - a.mll;
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - a.mll) / span) * 100))}%`;
  return (
    <div>
      <div className="relative mt-5 h-1.5 rounded-full bg-gradient-to-r from-down/30 via-line2 to-up/30">
        <div className="absolute -top-4 -translate-x-1/2 font-mono text-[8px] font-bold text-dim" style={{ left: pos(a.startBalance) }}>
          START
        </div>
        <div className="absolute -top-1 h-3.5 w-px bg-mute" style={{ left: pos(a.startBalance) }} />
        <div
          className={`absolute -top-[3px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-bg ${bal >= a.startBalance ? 'bg-up' : 'bg-down'} transition-all`}
          style={{ left: pos(bal) }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px]">
        <div>
          <div className="text-down">{money(a.mll)}</div>
          <div className="text-[8px] text-down/50">MLL</div>
        </div>
        <div className="text-right">
          <div className="text-up">{money(target)}</div>
          <div className="text-[8px] text-up/50">TARGET</div>
        </div>
      </div>
    </div>
  );
}

export function AccountCard({ a }: { a: Account }) {
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const resetAccount = useApp((s) => s.resetAccount);
  const setActive = useApp((s) => s.setActiveAccount);
  const plan = planById(a.planId);
  const pnl = totalPnl(a);
  const cons = consistency(a);
  const isEval = a.type === 'eval';

  return (
    <div className={`rounded-xl border bg-[#0f1013] p-4 ${a.status === 'breached' ? 'border-down/20' : a.status === 'passed' ? 'border-up/25' : 'border-line'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-tight">{plan.name}</span>
            <Tag>{isEval ? 'Eval' : 'Funded'}</Tag>
          </div>
          <div className="mt-1 font-mono text-[10px] text-dim">{a.id}</div>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-dim hover:text-ink">
          {collapsed ? <PlusCircle size={15} /> : <MinusCircle size={15} />}
        </button>
      </div>
      <div className="mt-3">
        <StatusTags a={a} />
      </div>
      {!collapsed && (
        <>
          <div className="my-3 border-t border-line" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Account balance</Label>
              <div className="mt-1 text-[15px] font-bold">
                {money(a.balance)} <span className="text-[11px] font-normal text-dim">/ {money(a.mll)}</span>
              </div>
            </div>
            <div>
              <Label>{isEval ? 'Profit target' : 'Total payouts'}</Label>
              <div className="mt-1 text-[15px] font-bold">
                {isEval ? (
                  <>
                    <span className={pnl >= 0 ? 'text-up' : 'text-down'}>{money(pnl)}</span>{' '}
                    <span className="text-[11px] font-normal text-dim">/ {money(plan.target)}</span>
                  </>
                ) : (
                  <span className="text-up">{money(a.payoutsTotal)}</span>
                )}
              </div>
            </div>
            <div>
              <Label>Trading days</Label>
              <div className="mt-1 text-[15px] font-bold text-up">{tradingDays(a)}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <Label>Consistency (50%)</Label>
              <div className={`mt-1 text-[15px] font-bold ${cons === null ? 'text-dim' : cons > 50 ? 'text-down' : 'text-up'}`}>{cons === null ? '—' : `${cons.toFixed(2)}%`}</div>
            </div>
            <div className="col-span-2">
              <Rail a={a} live={a.status === 'active'} />
            </div>
          </div>
          {a.statusReason && <div className={`mt-3 rounded-md px-2.5 py-1.5 text-[11px] ${a.status === 'breached' ? 'bg-down/10 text-down' : 'bg-up/10 text-up'}`}>{a.statusReason}</div>}
        </>
      )}
      <div className="mt-3 grid grid-cols-[1fr_1fr_1.3fr] gap-2 border-t border-line pt-3">
        <Btn onClick={() => resetAccount(a.id)} disabled={!isEval}>
          Reset
        </Btn>
        <Btn
          tone="blue"
          disabled={a.status !== 'active'}
          onClick={() => {
            setActive(a.id);
            nav('/trade');
          }}
        >
          Trade
        </Btn>
        <Btn onClick={() => nav(`/accounts/${a.id}`)}>View Details</Btn>
      </div>
    </div>
  );
}
