import { useMemo, useSyncExternalStore } from 'react';
import { courseBySlug, UPSELLS } from './data';

/** Cart, fake orders, owned courses and lesson progress. Lives in localStorage only. */

export interface Order {
  id: string;
  at: number;
  items: { slug: string; price: number }[];
  upsells: string[];
  coupon?: string;
  subtotal: number;
  discount: number;
  total: number;
  name: string;
}

interface State {
  cart: string[];
  orders: Order[];
  /** slug -> completed lesson ids */
  progress: Record<string, string[]>;
  name: string;
}

const KEY = 'larp-academy-v1';
const EMPTY: State = { cart: [], orders: [], progress: {}, name: '' };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<State>) };
  } catch {
    /* storage blocked or corrupt */
  }
  return EMPTY;
}

let state = load();
const subs = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* fine, it's a larp */
  }
  subs.forEach((f) => f());
}

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => pick(state),
  );
}

export const getState = () => state;

export function useOwned(): Set<string> {
  const orders = useStore((s) => s.orders);
  return useMemo(() => ownedSlugs(orders), [orders]);
}

/** Slugs you own, with bundles expanded. */
export function ownedSlugs(orders: Order[] = state.orders): Set<string> {
  const out = new Set<string>();
  for (const o of orders)
    for (const it of o.items) {
      out.add(it.slug);
      courseBySlug(it.slug)?.includes?.forEach((x) => out.add(x));
    }
  return out;
}

export const actions = {
  addToCart(slug: string) {
    if (state.cart.includes(slug) || ownedSlugs().has(slug)) return;
    set({ cart: [...state.cart, slug] });
  },
  removeFromCart(slug: string) {
    set({ cart: state.cart.filter((s) => s !== slug) });
  },
  setName(name: string) {
    set({ name });
  },
  placeOrder(o: Omit<Order, 'id' | 'at'>): Order {
    const order: Order = { ...o, id: `LA-${Math.floor(100000 + Math.random() * 900000)}`, at: Date.now() };
    set({ orders: [order, ...state.orders], cart: [] });
    return order;
  },
  toggleLesson(slug: string, lessonId: string) {
    const done = state.progress[slug] ?? [];
    const next = done.includes(lessonId) ? done.filter((x) => x !== lessonId) : [...done, lessonId];
    set({ progress: { ...state.progress, [slug]: next } });
  },
  completeLesson(slug: string, lessonId: string) {
    const done = state.progress[slug] ?? [];
    if (!done.includes(lessonId)) set({ progress: { ...state.progress, [slug]: [...done, lessonId] } });
  },
  reset() {
    set({ ...EMPTY });
  },
};

export const upsellTotal = (ids: string[]) => UPSELLS.filter((u) => ids.includes(u.id)).reduce((s, u) => s + u.price, 0);
