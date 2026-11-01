import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Menu, ShoppingCart, Timer, X } from 'lucide-react';
import { LARPCAPITAL_URL } from './api';
import { Link, Route, useRoute } from './router';
import { useOwned, useStore } from './store';
import { Countdown, Logo } from './ui';
import { Loader, Toast } from './motion';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import CourseDetail from './pages/CourseDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Order from './pages/Order';
import Library from './pages/Library';
import Learn from './pages/Learn';

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'catalog':
      return <Catalog category={route.category} />;
    case 'course':
      return <CourseDetail key={route.slug} slug={route.slug} />;
    case 'cart':
      return <Cart />;
    case 'checkout':
      return <Checkout />;
    case 'order':
      return <Order id={route.id} />;
    case 'library':
      return <Library />;
    case 'learn':
      return <Learn key={route.slug} slug={route.slug} lesson={route.lesson} />;
    default:
      return <Home />;
  }
}

export default function App() {
  const route = useRoute();
  const cartCount = useStore((s) => s.cart.length);
  const ownedCount = useOwned().size;
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState(0);
  const prevCart = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCart.current) setToast((t) => t + 1);
    prevCart.current = cartCount;
  }, [cartCount]);
  const pageKey = window.location.hash.split('?')[0] || 'home';

  const navLink = (to: string, label: string, active: boolean) => (
    <Link to={to} onClick={() => setMenu(false)} className={active ? 'text-ink' : 'hover:text-ink'}>
      {label}
    </Link>
  );

  const links = (
    <>
      {navLink('', 'Home', route.page === 'home')}
      {navLink('courses', 'Courses', route.page === 'catalog' || route.page === 'course')}
      {navLink('courses?category=Bundles', 'Bundles', false)}
      {navLink('library', `My courses${ownedCount ? ` (${ownedCount})` : ''}`, route.page === 'library' || route.page === 'learn')}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Loader />
      {toast > 0 && <Toast key={toast} id={toast} text="✓ Added to cart. Chase is proud of you." />}
      <div className="flex items-center justify-center gap-2 bg-up px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-bg">
        <Timer size={12} className="shrink-0" /> Sale ends in <Countdown /> <span className="hidden sm:inline">· up to 90% off · only 3 spots left (there are always 3)</span>
      </div>

      <nav className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="">
            <Logo />
          </Link>
          <div className="hidden items-center gap-7 text-[13px] text-mute md:flex">{links}</div>
          <div className="flex items-center gap-1.5">
            <a href={LARPCAPITAL_URL} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-mute hover:text-ink lg:flex">
              <ArrowLeft size={13} /> LarpCapital
            </a>
            <Link to="library" className="rounded-lg p-2 text-mute hover:text-ink md:hidden" aria-label="My courses">
              <BookOpen size={18} />
            </Link>
            <Link to="cart" className="relative rounded-lg p-2 text-mute hover:text-ink" aria-label="Cart">
              <ShoppingCart size={18} />
              {cartCount > 0 && <span key={cartCount} className="la-pop absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-up px-1 text-[10px] font-bold text-bg">{cartCount}</span>}
            </Link>
            <Link to="courses" className="la-shine hidden rounded-lg bg-up px-4 py-2 text-xs font-bold text-bg hover:brightness-110 sm:block">
              Enroll now
            </Link>
            <button onClick={() => setMenu((m) => !m)} className="rounded-lg p-2 text-mute md:hidden" aria-label="Menu">
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="flex flex-col gap-4 border-t border-line px-4 py-4 text-sm text-mute md:hidden">
            {links}
            <a href={LARPCAPITAL_URL} className="hover:text-ink">← Back to LarpCapital</a>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <div key={pageKey} className="la-page">
          <Page route={route} />
        </div>
      </main>

      <footer className="border-t border-line px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Logo />
          <div className="flex gap-5 text-[12px] text-mute">
            <Link to="courses" className="hover:text-ink">Courses</Link>
            <Link to="library" className="hover:text-ink">My courses</Link>
            <Link to="cart" className="hover:text-ink">Cart</Link>
            <a href={LARPCAPITAL_URL} className="hover:text-ink">LarpCapital</a>
          </div>
          <div className="max-w-2xl text-[12px] leading-relaxed text-dim">
            Larp Academy is a parody of trading-course funnels, made for a hackathon alongside{' '}
            <a href={LARPCAPITAL_URL} className="text-mute underline hover:text-ink">LarpCapital</a>, a simulated prop firm. No course exists, nothing is for sale, no payment can be taken, every photo is a stand-in and every person is made up. Purchases and progress are saved only in your browser. Not financial advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
