import { useEffect, useState } from 'react';
import { CreditCard, Loader2, Lock, ShieldCheck, Tag } from 'lucide-react';
import { COUPONS, courseBySlug, money, UPSELLS } from '../data';
import { go, Link } from '../router';
import { actions, upsellTotal, useStore } from '../store';
import { Countdown } from '../ui';

// No card fields on purpose: this checkout can't take a payment, and doesn't pretend to collect one.
const METHODS = [
  { id: 'card', label: 'Saved card •••• 6969', note: 'not yours, not real' },
  { id: 'klarna', label: 'Pay in 4 easy installments', note: 'of your entire paycheck' },
  { id: 'parents', label: 'Your parents’ card', note: 'saved from Fortnite' },
];

const PROCESSING = ['Verifying your mindset…', 'Contacting the Lambo rental place…', 'Moving the guru’s stop loss…', 'Deleting red days from the Discord…', 'Adding you to 14 email lists…'];

export default function Checkout() {
  const cart = useStore((s) => s.cart);
  const savedName = useStore((s) => s.name);
  const [name, setName] = useState(savedName);
  const [picked, setPicked] = useState<string[]>(UPSELLS.map((u) => u.id));
  const [method, setMethod] = useState('card');
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState(0);

  const items = cart.map((s) => courseBySlug(s)!).filter(Boolean);
  const subtotal = items.reduce((s, c) => s + c.price, 0);
  const discount = coupon ? Math.round((subtotal * COUPONS[coupon].pct) / 100) : 0;
  const extras = upsellTotal(picked);
  const total = subtotal - discount + extras;

  useEffect(() => {
    if (!processing) return;
    const tick = setInterval(() => setMsg((m) => (m + 1) % PROCESSING.length), 650);
    const done = setTimeout(() => {
      actions.setName(name.trim());
      const order = actions.placeOrder({
        items: items.map((c) => ({ slug: c.slug, price: c.price })),
        upsells: picked,
        coupon: coupon ?? undefined,
        subtotal,
        discount,
        total,
        name: name.trim() || 'Future Funded Trader',
      });
      go(`order/${order.id}`);
    }, 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processing]);

  const applyCoupon = () => {
    const k = code.trim().toUpperCase();
    if (COUPONS[k]) {
      setCoupon(k);
      setCouponMsg(COUPONS[k].note);
    } else {
      setCoupon(null);
      setCouponMsg('Invalid code. Try LARP, CHASE90 or FREE (they’re in every YouTube description).');
    }
  };

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (processing) {
    return (
      <div className="flex flex-col items-center px-4 py-32 text-center">
        <Loader2 size={40} className="animate-spin text-up" />
        <div className="mt-6 font-display text-lg font-bold">Processing your order</div>
        <div className="mt-2 text-sm text-mute">{PROCESSING[msg]}</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-mute">Your cart is empty. Your potential, however, is full.</p>
        <Link to="courses" className="mt-6 inline-block rounded-xl bg-up px-6 py-3 text-sm font-bold text-bg">Browse courses</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-mute">
        <Lock size={12} /> Secure checkout <span className="text-dim">(secured by vibes)</span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold">Checkout</h1>
      <div className="mt-2 text-[13px] font-semibold text-down">Your reserved spot expires in <Countdown /></div>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-sm font-semibold">1. Your name</div>
            <div className="mt-1 text-[12px] text-dim">Goes on your certificate of completion. Stays in this browser.</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Future Funded Trader"
              className="mt-3 w-full rounded-lg border border-line2 bg-bg px-3 py-2.5 text-sm outline-none focus:border-up/60"
            />
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-sm font-semibold">2. Recommended for you</div>
            <div className="mt-1 text-[12px] text-dim">Pre-selected, for your convenience. Mostly ours.</div>
            <div className="mt-3 space-y-2">
              {UPSELLS.map((u) => (
                <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5 text-sm">
                  <input type="checkbox" checked={picked.includes(u.id)} onChange={() => toggle(u.id)} className="accent-[#2fd98a]" />
                  <span className="flex-1">
                    {u.name} <span className="text-[11px] text-dim">({u.note})</span>
                  </span>
                  <span className="font-mono text-mute">+{money(u.price)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="text-sm font-semibold">3. Payment</div>
            <div className="mt-1 text-[12px] text-dim">This is a parody: there’s nowhere to enter a card, and nothing is ever charged.</div>
            <div className="mt-3 space-y-2">
              {METHODS.map((m) => (
                <label key={m.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm ${method === m.id ? 'border-up/60 bg-up/5' : 'border-line bg-panel2'}`}>
                  <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[#2fd98a]" />
                  <CreditCard size={15} className="text-mute" />
                  <span className="flex-1">
                    {m.label} <span className="text-[11px] text-dim">({m.note})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-line2 bg-panel p-5 md:sticky md:top-24">
          <div className="text-sm font-semibold">Order summary</div>
          <div className="mt-3 space-y-2 border-b border-line pb-3 text-sm">
            {items.map((c) => (
              <div key={c.slug} className="flex justify-between gap-3">
                <span className="text-mute">{c.title}</span>
                <span className="font-mono">{money(c.price)}</span>
              </div>
            ))}
            {UPSELLS.filter((u) => picked.includes(u.id)).map((u) => (
              <div key={u.id} className="flex justify-between gap-3 text-[13px]">
                <span className="text-dim">+ {u.name}</span>
                <span className="font-mono text-dim">{money(u.price)}</span>
              </div>
            ))}
            {discount > 0 && (
              <div className="flex justify-between gap-3 text-[13px] text-up">
                <span>Coupon {coupon}</span>
                <span className="font-mono">-{money(discount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-line2 bg-bg px-3 py-2">
              <Tag size={13} className="text-dim" />
              <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} placeholder="Coupon code" className="w-full bg-transparent text-sm uppercase outline-none placeholder:normal-case placeholder:text-dim" />
            </label>
            <button onClick={applyCoupon} className="rounded-lg border border-line2 px-3 text-[12px] font-semibold hover:bg-panel2">Apply</button>
          </div>
          {couponMsg && <div className={`mt-2 text-[11px] ${coupon ? 'text-up' : 'text-down'}`}>{couponMsg}</div>}

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-mute">Total today</span>
            <span className="font-display text-3xl font-bold text-up">{total === 0 ? '$0' : money(total)}</span>
          </div>
          <button onClick={() => setProcessing(true)} className="mt-4 w-full rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg transition hover:brightness-110">
            Complete purchase
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-dim">
            <ShieldCheck size={12} /> 256-bit encrypted larp · no real payment
          </div>
        </div>
      </div>
    </div>
  );
}
