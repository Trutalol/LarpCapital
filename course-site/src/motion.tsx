import { CSSProperties, ElementType, ReactNode, useEffect, useRef, useState } from 'react';

/** Fades children up when they scroll into view. `delay` (ms) staggers siblings. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: ElementType }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setSettled(true), delay + 750);
    return () => clearTimeout(t);
  }, [inView, delay]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) return setInView(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // drop the stagger delay once revealed, so hover effects stay snappy
  const style: CSSProperties = settled ? {} : { transitionDelay: `${delay}ms` };
  return (
    <Tag ref={ref} style={style} className={`la-reveal ${inView ? 'is-in' : ''} ${className}`}>
      {children}
    </Tag>
  );
}

/** Counts up from 0 to `to` once visible. */
export function CountUp({ to, prefix = '', suffix = '', ms = 1400 }: { to: number; prefix?: string; suffix?: string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, ms]);
  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}

const LOADING = ['Renting the Lambo…', 'Drawing the Asia range…', 'Waiting for the 9:47 sweep…', 'Resetting the countdown timer…', 'Inflating the “was” prices…'];

/** First-load splash: candles pump, fake progress fills, then it fades out. */
export function Loader() {
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    const total = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 1700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / total);
      // stalls at 99% for a moment, like every guru checkout
      setPct(p < 0.85 ? Math.round((p / 0.85) * 99) : p < 1 ? 99 : 100);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    const m = setInterval(() => setMsg((x) => (x + 1) % LOADING.length), 420);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(m);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 450);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;
  const bars = [
    { x: 8.5, h: 10, c: '#2fd98a', d: 0 },
    { x: 17.5, h: 12, c: '#2fd98a', d: 0.15 },
    { x: 26.5, h: 9, c: '#e7e8eb', d: 0.3 },
  ];
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      style={done ? { animation: 'la-loader-out 0.45s ease-in forwards' } : undefined}
      aria-label="Loading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(47,217,138,0.12),transparent_60%)]" />
      <svg width={84} height={84} viewBox="0 0 40 40" className="relative">
        <rect width="40" height="40" rx="10" fill="#0f1a14" stroke="#2fd98a33" />
        {bars.map((b) => (
          <g key={b.x} style={{ transformOrigin: `${b.x + 2.5}px 22px`, animation: `la-candle 0.9s ease-in-out ${b.d}s infinite` }}>
            <line x1={b.x + 2.5} y1={22 - b.h} x2={b.x + 2.5} y2={22 + b.h} stroke={b.c} strokeWidth="1.4" />
            <rect x={b.x} y={22 - b.h / 2 - 2} width="5" height={b.h + 4} rx="1" fill={b.c} />
          </g>
        ))}
      </svg>
      <div className="relative mt-5 font-display text-lg font-semibold tracking-tight">
        LARP <span className="text-mute">ACADEMY</span>
      </div>
      <div className="relative mt-6 h-1 w-56 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-up transition-[width] duration-100" style={{ width: `${pct}%` }} />
      </div>
      <div className="relative mt-3 flex w-56 justify-between font-mono text-[11px] text-mute">
        <span>{LOADING[msg]}</span>
        <span className="tabular-nums text-up">{pct}%</span>
      </div>
    </div>
  );
}

const COLORS = ['#2fd98a', '#f5b83d', '#e7e8eb', '#2962ff', '#f2545b'];

/** One-shot confetti burst (pure CSS), for the order page. */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4200);
    return () => clearTimeout(t);
  }, []);
  const [bits] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.6,
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      round: Math.random() > 0.6,
    })),
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.45,
            background: b.color,
            borderRadius: b.round ? '50%' : 2,
            animation: `la-confetti ${b.dur}s cubic-bezier(.2,.6,.4,1) ${b.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

/** Small "added to cart" toast; bump `id` to show it again. */
export function Toast({ id, text }: { id: number; text: string }) {
  if (!id) return null;
  return (
    <div
      key={id}
      className="fixed bottom-6 left-1/2 z-[70] rounded-xl border border-up/40 bg-panel px-4 py-3 text-sm shadow-2xl"
      style={{ animation: 'la-toast 2.4s ease-out forwards' }}
    >
      {text}
    </div>
  );
}
