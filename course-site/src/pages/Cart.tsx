import { ShoppingCart, Trash2 } from 'lucide-react';
import { courseBySlug, COURSES, money } from '../data';
import { go, Link } from '../router';
import { actions, useOwned, useStore } from '../store';
import { Photo, Price } from '../ui';

export default function Cart() {
  const cart = useStore((s) => s.cart);
  const owned = useOwned();
  const items = cart.map((s) => courseBySlug(s)!).filter(Boolean);
  const subtotal = items.reduce((s, c) => s + c.price, 0);
  const was = items.reduce((s, c) => s + c.was, 0);
  const suggestion = COURSES.find((c) => !cart.includes(c.slug) && !owned.has(c.slug) && c.price > 0 && !c.includes);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <h1 className="font-display text-3xl font-bold">Your cart</h1>
      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-panel px-6 py-16 text-center">
          <ShoppingCart size={32} className="mx-auto text-dim" />
          <div className="mt-4 font-semibold">Your cart is empty</div>
          <p className="mt-1 text-sm text-mute">Chase is disappointed, but not surprised.</p>
          <Link to="courses" className="mt-6 inline-block rounded-xl bg-up px-6 py-3 text-sm font-bold text-bg hover:brightness-110">Browse courses</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <div className="text-sm text-mute">{items.length} course{items.length > 1 ? 's' : ''} in cart</div>
            {items.map((c) => (
              <div key={c.slug} className="flex gap-4 rounded-2xl border border-line bg-panel p-3">
                <Link to={`courses/${c.slug}`} className="w-32 shrink-0">
                  <Photo scene={c.scene} className="aspect-video rounded-xl" badge={false} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`courses/${c.slug}`} className="font-semibold hover:text-up">{c.title}</Link>
                  <div className="mt-0.5 truncate text-[12px] text-mute">{c.subtitle}</div>
                  <button onClick={() => actions.removeFromCart(c.slug)} className="mt-auto flex items-center gap-1 self-start text-[12px] text-dim hover:text-down">
                    <Trash2 size={12} /> Remove (Chase will notice)
                  </button>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display font-bold">{money(c.price)}</div>
                  <div className="text-[12px] text-dim line-through">{money(c.was)}</div>
                </div>
              </div>
            ))}
            {suggestion && (
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-dashed border-warn/40 bg-warn/5 p-4">
                <div className="flex-1">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-warn">Frequently bought together</div>
                  <div className="mt-1 text-sm font-semibold">{suggestion.title}</div>
                  <div className="mt-1"><Price price={suggestion.price} was={suggestion.was} /></div>
                </div>
                <button onClick={() => actions.addToCart(suggestion.slug)} className="rounded-lg border border-warn/50 px-3 py-2 text-[12px] font-semibold text-warn hover:bg-warn/10">
                  Add it
                </button>
              </div>
            )}
          </div>

          <div className="h-fit rounded-2xl border border-line2 bg-panel p-5 md:sticky md:top-24">
            <div className="text-sm text-mute">Total</div>
            <div className="mt-1 font-display text-4xl font-bold">{money(subtotal)}</div>
            {was > subtotal && (
              <div className="mt-1 text-sm text-dim">
                <span className="line-through">{money(was)}</span> · you “save” {money(was - subtotal)}
              </div>
            )}
            <button onClick={() => go('checkout')} className="mt-5 w-full rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg hover:brightness-110">
              Checkout
            </button>
            <Link to="courses" className="mt-2 block text-center text-[12px] text-dim hover:text-ink">Keep shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
