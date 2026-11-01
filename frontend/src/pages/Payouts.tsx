import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CreditCard, DollarSign, Loader2, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Btn, Empty, Label, Panel, Tag } from '../components/ui';
import { Account, useApp } from '../lib/store';
import { planById } from '../lib/plans';
import { money } from '../lib/format';

function PayoutRow({ a }: { a: Account }) {
  const plan = planById(a.planId);
  const available = Math.max(0, a.balance - a.startBalance);
  const [amount, setAmount] = useState(String(Math.floor(available)));
  const request = useApp((s) => s.requestPayout);
  const open = Object.keys(a.positions).length > 0;
  const eligible = available >= plan.minPayout && !open;
  const gross = Number(amount) || 0;

  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1.6fr] items-center gap-4 border-t border-line px-5 py-4">
      <div>
        <div className="text-[13px] font-bold">{plan.name}</div>
        <div className="font-mono text-[10px] text-dim">{a.id}</div>
      </div>
      <div>
        <Label>Balance</Label>
        <div className="font-mono text-[13px]">{money(a.balance, { cents: true })}</div>
      </div>
      <div>
        <Label>Withdrawable</Label>
        <div className={`font-mono text-[13px] ${available > 0 ? 'text-up' : 'text-dim'}`}>{money(available, { cents: true })}</div>
      </div>
      <div>
        <Label>You receive ({plan.payoutSplit * 100}%)</Label>
        <div className="font-mono text-[13px]">{money(Math.min(gross, available) * plan.payoutSplit, { cents: true })}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-line2 bg-panel2 px-2.5">
          <span className="text-dim">$</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} className="w-full bg-transparent px-1 py-2 font-mono text-[12px] outline-none" />
          <button onClick={() => setAmount(String(Math.floor(available)))} className="font-mono text-[10px] text-dim hover:text-ink">MAX</button>
        </div>
        <Btn tone="green" disabled={!eligible} onClick={() => request(a.id, gross)}>
          Request
        </Btn>
      </div>
      {!eligible && (
        <div className="col-span-5 -mt-2 flex items-center gap-1.5 text-[11px] text-mute">
          <AlertCircle size={12} />
          {open ? 'Close open positions first.' : `Need at least ${money(plan.minPayout)} in profit to request a payout.`}
        </div>
      )}
    </div>
  );
}

export default function Payouts() {
  const accounts = useApp((s) => s.accounts);
  const payouts = useApp((s) => s.payouts);
  const verified = useApp((s) => s.profile.verified);
  const setVerified = useApp((s) => s.setVerified);
  const nav = useNavigate();
  const funded = accounts.filter((a) => a.type === 'funded' && a.status === 'active');
  const paid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.net, 0);

  return (
    <div className="pb-16">
      <PageHeader title="PAYOUTS" />
      <div className="mx-10 mt-8 space-y-4 rounded-2xl border border-line bg-[#0d0e10] p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-8 px-2">
            <div>
              <Label>Total paid out</Label>
              <div className="mt-1 text-2xl font-bold text-up">{money(paid, { cents: true })}</div>
            </div>
            <div>
              <Label>Requests</Label>
              <div className="mt-1 text-2xl font-bold">{payouts.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line p-1.5">
            {verified ? <Tag tone="green">Vibes verified</Tag> : <Tag tone="amber">Not verified</Tag>}
            <Btn tone="green" onClick={() => setVerified(!verified)}>
              <UserCheck size={13} /> {verified ? 'Verified (trust me)' : 'ID Verification'}
            </Btn>
          </div>
        </div>

        <Panel>
          <div className="flex items-center gap-2 px-5 py-4 text-[12px] font-bold uppercase">
            <DollarSign size={14} className="text-up" /> Payout requests
          </div>
          {funded.length === 0 ? (
            <div className="border-t border-line">
              <Empty
                icon={<CreditCard size={34} strokeWidth={1.3} />}
                title="No Payout Requests"
                body="You don't have any eligible accounts for payout at this time. Pass an evaluation to get a funded account."
                action={<Btn onClick={() => nav('/add')}>Start an evaluation</Btn>}
              />
            </div>
          ) : (
            funded.map((a) => <PayoutRow key={a.id} a={a} />)
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 px-5 py-4 text-[12px] font-bold uppercase">
            <Clock size={14} className="text-up" /> Payout history
          </div>
          {payouts.length === 0 ? (
            <div className="border-t border-line">
              <Empty icon={<Clock size={34} strokeWidth={1.3} />} title="No Payout History" body="Your completed payouts will appear here." />
            </div>
          ) : (
            <table className="w-full font-mono text-[12px]">
              <thead>
                <tr className="border-t border-line text-left text-[10px] uppercase text-dim">
                  {['Requested', 'Account', 'Plan', 'Gross', 'Net', 'Status', ''].map((h) => (
                    <th key={h} className="px-5 py-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-5 py-3">{new Date(p.requestedAt).toLocaleString()}</td>
                    <td className="px-5">{p.accountId}</td>
                    <td className="px-5">{p.planName}</td>
                    <td className="px-5">{money(p.gross, { cents: true })}</td>
                    <td className="px-5 text-up">{money(p.net, { cents: true })}</td>
                    <td className="px-5">
                      {p.status === 'paid' ? (
                        <Tag tone="green">Paid</Tag>
                      ) : (
                        <span className="flex items-center gap-1.5 text-warn"><Loader2 size={12} className="animate-spin" /> Processing</span>
                      )}
                    </td>
                    <td className="px-5 text-right">
                      {p.certId && (
                        <button onClick={() => nav(`/certificates?c=${p.certId}`)} className="text-[11px] text-up hover:underline">
                          Certificate →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
