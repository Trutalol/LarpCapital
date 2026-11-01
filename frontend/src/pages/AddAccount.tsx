import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Btn, Tag } from '../components/ui';
import { PLANS } from '../lib/plans';
import { useApp } from '../lib/store';
import { money } from '../lib/format';

const FAMILIES = {
  flex: { name: 'LarpFlex', blurb: 'End-of-day drawdown, no daily loss limit. For traders who like to hold and hope.' },
  pro: { name: 'LarpPro', blurb: 'Intraday trailing drawdown with a daily loss limit. Cheaper, meaner.' },
};

export default function AddAccount() {
  const [family, setFamily] = useState<'flex' | 'pro'>('flex');
  const addAccount = useApp((s) => s.addAccount);
  const nav = useNavigate();
  const plans = PLANS.filter((p) => p.family === family);

  return (
    <div className="pb-16">
      <PageHeader title="ADD ACCOUNT" subtitle="Pick an evaluation. Payment is fake. The suffering is real." />
      <div className="mx-10 mt-8">
        <div className="inline-flex rounded-xl border border-line bg-panel p-1">
          {(['flex', 'pro'] as const).map((f) => (
            <button key={f} onClick={() => setFamily(f)} className={`rounded-lg px-5 py-2 text-xs font-semibold ${family === f ? 'bg-panel2 text-ink ring-1 ring-line2' : 'text-mute'}`}>
              {FAMILIES[f].name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-mute">{FAMILIES[family].blurb}</p>

        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {plans.map((p, i) => (
            <div key={p.id} className={`relative flex flex-col rounded-2xl border bg-panel p-5 ${i === 1 ? 'border-up/50 shadow-[0_0_50px_rgba(47,217,138,0.08)]' : 'border-line'}`}>
              {i === 1 && <div className="absolute -top-2.5 left-5"><Tag tone="green">Most larped</Tag></div>}
              <div className="font-mono text-[11px] text-dim">{p.name}</div>
              <div className="mt-1 font-display text-4xl font-bold">${p.size / 1000}K</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-up">$0</span>
                <span className="text-sm text-dim line-through">{money(p.fee)}</span>
                <span className="text-[11px] text-mute">/ one-time</span>
              </div>
              <div className="my-4 border-t border-line" />
              <ul className="space-y-2 text-[12px]">
                {[
                  ['Profit target', money(p.target)],
                  ['Max loss limit', `${money(p.drawdown)} ${p.drawdownType === 'EOD' ? 'EOD' : 'trailing'}`],
                  ['Daily loss limit', p.dll ? money(p.dll) : 'None'],
                  ['Max size', `${p.maxMinis} minis / ${p.maxMinis * 10} micros`],
                  ['Profit split', `${p.payoutSplit * 100}%`],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-mute">
                      <Check size={12} className="text-up" /> {k}
                    </span>
                    <span className="font-mono font-semibold">{v}</span>
                  </li>
                ))}
              </ul>
              <Btn
                tone={i === 1 ? 'green' : 'ghost'}
                className="mt-5 py-2.5"
                onClick={() => {
                  addAccount(p.id);
                  nav('/trade');
                }}
              >
                Buy evaluation
              </Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
