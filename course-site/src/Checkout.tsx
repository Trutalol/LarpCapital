import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, CreditCard, Loader2, Lock, X } from 'lucide-react';
import { LARPCAPITAL_URL } from './api';

export interface Product {
  name: string;
  price: number;
}

// Pre-checked upsells, because of course they are.
const UPSELLS = [
  { id: 'vip', name: 'VIP Discord', note: 'lifetime of the Discord, not yours', price: 297 },
  { id: 'call', name: '1-on-1 call', note: "with the guru's cousin", price: 497 },
  { id: 'guarantee', name: 'Funded Guarantee™', note: 'not a guarantee', price: 197 },
];

const PROCESSING = ['Verifying your mindset…', 'Contacting the Lambo rental place…', 'Moving the guru’s stop loss…', 'Deleting red days from the Discord…'];

const RED_FLAGS = [
  ['Income claims with no audited statements', 'Screenshots, certificates and "payout proofs" are trivial to fake. This whole site took an afternoon.'],
  ['Lifestyle photos', 'Every car, view and yacht on this page is AI-generated. Real gurus rent them by the hour.'],
  ['Fake urgency', 'The timer resets. There are always 3 spots left.'],
  ['Testimonials you can’t verify', 'Jaden, 19, does not exist. Neither do most of them.'],
  ['Prop-firm "funded" certificates as proof', 'Passing an evaluation isn’t income. Most funded accounts never pay out.'],
  ['Upsells pre-checked at checkout', 'You almost paid for three of them without noticing.'],
];

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function Checkout({ product, onClose }: { product: Product; onClose: () => void }) {
  const [stage, setStage] = useState<'cart' | 'processing' | 'reveal'>('cart');
  const [picked, setPicked] = useState<Set<string>>(new Set(UPSELLS.map((u) => u.id)));
  const [msg, setMsg] = useState(0);
  const total = product.price + UPSELLS.filter((u) => picked.has(u.id)).reduce((s, u) => s + u.price, 0);

  useEffect(() => {
    if (stage !== 'processing') return;
    const tick = setInterval(() => setMsg((m) => (m + 1) % PROCESSING.length), 700);
    const done = setTimeout(() => setStage('reveal'), 2800);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [stage]);

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-line2 bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-dim hover:text-ink" aria-label="Close">
          <X size={18} />
        </button>

        {stage === 'cart' && (
          <div className="p-6">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-mute">
              <Lock size={12} /> Secure checkout
            </div>
            <div className="mt-4 flex justify-between border-b border-line pb-4 text-sm">
              <span className="font-semibold">{product.name}</span>
              <span className="font-mono">{money(product.price)}</span>
            </div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-up">Recommended for you</div>
            <div className="mt-2 space-y-2">
              {UPSELLS.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5 text-sm">
                  <input type="checkbox" checked={picked.has(u.id)} onChange={() => toggle(u.id)} className="accent-[#2fd98a]" />
                  <span className="flex-1">
                    {u.name} <span className="text-[11px] text-dim">({u.note})</span>
                  </span>
                  <span className="font-mono text-mute">+{money(u.price)}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm text-mute">Total today</span>
              <span className="font-display text-3xl font-bold text-up">{money(total)}</span>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-line2 bg-bg px-3 py-3 text-sm text-mute">
              <CreditCard size={16} /> Saved card •••• 6969
            </div>
            <button
              onClick={() => setStage('processing')}
              className="mt-4 w-full rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg transition hover:brightness-110"
            >
              Complete purchase · {money(total)}
            </button>
          </div>
        )}

        {stage === 'processing' && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Loader2 size={36} className="animate-spin text-up" />
            <div className="mt-5 text-sm text-mute">{PROCESSING[msg]}</div>
          </div>
        )}

        {stage === 'reveal' && (
          <div className="p-6">
            <div className="flex items-center gap-2 text-down">
              <AlertTriangle size={18} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Nothing was charged. Nothing could be.</span>
            </div>
            <div className="mt-3 font-display text-2xl font-bold leading-tight">
              You almost paid <span className="text-up">{money(total)}</span> for a larp.
            </div>
            <p className="mt-2 text-sm text-mute">
              The Larp Model™ isn’t real. Neither is the income, the guru, or the Lambo. But every trick on this page is copied from real trading-course funnels. Here’s what to watch for:
            </p>
            <ul className="mt-4 space-y-3">
              {RED_FLAGS.map(([title, body]) => (
                <li key={title} className="flex gap-2.5 text-sm">
                  <Check size={15} className="mt-0.5 shrink-0 text-up" />
                  <span>
                    <span className="font-semibold">{title}.</span> <span className="text-mute">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={LARPCAPITAL_URL}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg transition hover:brightness-110"
            >
              Trade the sim for free on LarpCapital <ArrowRight size={15} />
            </a>
            <button onClick={onClose} className="mt-2 w-full py-2 text-xs text-dim hover:text-ink">
              Back to the larp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
