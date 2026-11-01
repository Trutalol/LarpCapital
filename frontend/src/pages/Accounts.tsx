import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { AccountCard } from '../components/AccountBits';
import { Btn, Empty } from '../components/ui';
import { useApp } from '../lib/store';
import { useMarket } from '../lib/market';

type TypeF = 'eval' | 'funded' | 'all';
type StatusF = 'active' | 'breached' | 'passed' | 'all';

function Seg<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="px-2 font-mono text-[11px] font-semibold text-dim">{label}</span>
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${value === v ? 'bg-panel2 text-ink ring-1 ring-line2' : 'text-mute hover:text-ink'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Accounts() {
  const name = useApp((s) => s.profile.name);
  const accounts = useApp((s) => s.accounts);
  const settleDay = useApp((s) => s.settleDay);
  const nav = useNavigate();
  const [type, setType] = useState<TypeF>('all');
  const [status, setStatus] = useState<StatusF>('all');
  useMarket((s) => s.simTime); // keep live balances moving

  const shown = accounts.filter((a) => (type === 'all' || a.type === type) && (status === 'all' || a.status === status));

  return (
    <div className="pb-16">
      <PageHeader big title={`Welcome ${name}`} subtitle="Here's an overview of your accounts" />
      <div className="mx-10 mt-8 rounded-2xl border border-line bg-[#0d0e10] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-1.5">
            <Seg label="TYPE" value={type} onChange={setType} options={[['eval', 'LarpEvals'], ['funded', 'LarpFunded'], ['all', 'All']]} />
            <div className="mx-1 h-5 w-px bg-line2" />
            <Seg label="STATUS" value={status} onChange={setStatus} options={[['active', 'Active'], ['breached', 'Breached'], ['passed', 'Passed'], ['all', 'All']]} />
          </div>
          <div className="flex gap-2">
            <Btn onClick={settleDay}>Settle trading day (EOD)</Btn>
            <Btn tone="green" onClick={() => nav('/add')}>
              + New evaluation
            </Btn>
          </div>
        </div>
        {shown.length === 0 ? (
          <Empty
            icon={<Wallet size={34} strokeWidth={1.3} />}
            title={accounts.length ? 'No accounts match these filters' : 'No accounts yet'}
            body={accounts.length ? 'Try a different type or status.' : 'Start an evaluation, hit the profit target, and get funded.'}
            action={!accounts.length && <Btn tone="green" onClick={() => nav('/add')}>Start an evaluation</Btn>}
          />
        ) : (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(440px,1fr))] gap-4">
            {shown.map((a) => (
              <AccountCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
