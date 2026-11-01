import { AlertTriangle, ArrowRight, Check, PartyPopper } from 'lucide-react';
import { LARPCAPITAL_URL } from '../api';
import { courseBySlug, money, RED_FLAGS, UPSELLS } from '../data';
import { go, Link } from '../router';
import { useStore } from '../store';
import { Photo } from '../ui';
import { Confetti, Reveal } from '../motion';

export default function Order({ id }: { id: string }) {
  const order = useStore((s) => s.orders.find((o) => o.id === id));

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-mute">Like the guru’s trading statements.</p>
        <Link to="library" className="mt-6 inline-block text-up">My courses →</Link>
      </div>
    );
  }

  const courses = order.items.map((i) => courseBySlug(i.slug)!).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
      {Date.now() - order.at < 10000 && <Confetti />}
      <div className="text-center">
        <PartyPopper size={36} className="la-pop mx-auto text-up" />
        <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">{order.name === 'Future Funded Trader' ? 'You’re enrolled!' : `You’re enrolled, ${order.name.split(' ')[0]}!`}</h1>
        <p className="mt-2 text-mute">Order {order.id} · {new Date(order.at).toLocaleString()}</p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="text-sm font-semibold">Your new courses</div>
          <div className="mt-3 space-y-3">
            {courses.map((c) => (
              <div key={c.slug} className="flex items-center gap-3">
                <Photo scene={c.scene} className="aspect-video w-24 shrink-0 rounded-lg" badge={false} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.title}</div>
                  <button onClick={() => go(c.includes ? 'library' : `learn/${c.slug}`)} className="mt-1 text-[12px] font-semibold text-up hover:underline">
                    {c.includes ? 'Open My Courses →' : 'Start course →'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5 text-sm">
          <div className="font-semibold">Receipt</div>
          <div className="mt-3 space-y-1.5 text-mute">
            {order.items.map((i) => (
              <div key={i.slug} className="flex justify-between gap-3"><span>{courseBySlug(i.slug)?.title}</span><span className="font-mono">{money(i.price)}</span></div>
            ))}
            {UPSELLS.filter((u) => order.upsells.includes(u.id)).map((u) => (
              <div key={u.id} className="flex justify-between gap-3 text-dim"><span>+ {u.name}</span><span className="font-mono">{money(u.price)}</span></div>
            ))}
            {order.discount > 0 && <div className="flex justify-between gap-3 text-up"><span>Coupon {order.coupon}</span><span className="font-mono">-{money(order.discount)}</span></div>}
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <span>Listed total</span>
            <span className="font-mono font-bold">{order.total === 0 ? '$0' : money(order.total)}</span>
          </div>
          <div className="mt-1 flex justify-between text-up">
            <span>Actually charged</span>
            <span className="font-mono font-bold">$0.00</span>
          </div>
        </div>
      </div>

      {/* the reveal */}
      <Reveal delay={300} className="mt-10 rounded-2xl border border-down/40 bg-down/5 p-6">
        <div className="flex items-center gap-2 text-down">
          <AlertTriangle size={18} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Nothing was charged. Nothing could be.</span>
        </div>
        {order.total > 0 ? (
          <div className="mt-3 font-display text-2xl font-bold leading-tight">
            You almost paid <span className="text-up">{money(order.total)}</span> for a larp.
          </div>
        ) : (
          <div className="mt-3 font-display text-2xl font-bold leading-tight">Free. And still a funnel.</div>
        )}
        <p className="mt-2 text-sm text-mute">
          Larp Academy isn’t real. Neither is the income, the guru, or the Lambo. But every trick on this site is copied from real trading-course funnels. Here’s what to watch for:
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {RED_FLAGS.map(([title, body]) => (
            <li key={title} className="flex gap-2.5 text-sm">
              <Check size={15} className="mt-0.5 shrink-0 text-up" />
              <span>
                <span className="font-semibold">{title}.</span> <span className="text-mute">{body}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a href={LARPCAPITAL_URL} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg hover:brightness-110">
            Trade the sim for free on LarpCapital <ArrowRight size={15} />
          </a>
          <Link to="library" className="flex flex-1 items-center justify-center rounded-xl border border-line2 py-3.5 text-sm font-semibold hover:bg-panel2">
            Go to My Courses anyway
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
