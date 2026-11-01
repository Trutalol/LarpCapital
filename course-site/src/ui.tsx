import { ReactNode, useEffect, useState } from 'react';
import { BadgeCheck, Clock, PlayCircle, Star, Users } from 'lucide-react';
import { SCENES, Scene } from './api';
import { Course, INSTRUCTORS, money, openLessons } from './data';
import { Link } from './router';
import { useOwned, useStore } from './store';

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={32} height={32} viewBox="0 0 40 40">
        <rect width="40" height="40" rx="10" fill="#0f1a14" stroke="#2fd98a33" />
        <line x1="11" y1="13" x2="11" y2="31" stroke="#2fd98a" strokeWidth="1.4" />
        <rect x="8.5" y="17" width="5" height="10" rx="1" fill="#2fd98a" />
        <line x1="20" y1="8" x2="20" y2="27" stroke="#2fd98a" strokeWidth="1.4" />
        <rect x="17.5" y="11" width="5" height="12" rx="1" fill="#2fd98a" />
        <line x1="29" y1="5" x2="29" y2="20" stroke="#e7e8eb" strokeWidth="1.4" />
        <rect x="26.5" y="7" width="5" height="9" rx="1" fill="#e7e8eb" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-[15px] font-semibold tracking-tight">LARP</div>
        <div className="mt-1 font-display text-[8px] tracking-[0.32em] text-mute">ACADEMY</div>
      </div>
    </div>
  );
}

export function Countdown() {
  const [left, setLeft] = useState(14 * 60 + 59);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 14 * 60 + 59 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums">
      {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
    </span>
  );
}

/** Lifestyle photo with the parody badge baked into the frame. */
export function Photo({ scene, caption, className = '', badge = true }: { scene: Scene; caption?: string; className?: string; badge?: boolean }) {
  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-line2 bg-panel ${className}`}>
      <img src={SCENES[scene]} alt="" className="h-full w-full object-cover" />
      {badge && <span className="absolute right-2 top-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-ink/70">Parody</span>}
      {caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10 text-sm text-ink">{caption}</figcaption>}
    </figure>
  );
}

export function Stars({ size = 12, n = 5 }: { size?: number; n?: number }) {
  return (
    <div className="flex text-warn">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size} fill={i < Math.round(n) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

export function SectionHead({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-up">{kicker}</div>
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] text-mute">{sub}</p>}
    </div>
  );
}

export function Avatar({ initial, size = 36 }: { initial: string; size?: number }) {
  return (
    <div className="grid shrink-0 place-items-center rounded-full border border-line2 bg-bg font-display text-up" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initial}
    </div>
  );
}

export function Price({ price, was, big = false }: { price: number; was: number; big?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-display font-bold ${big ? 'text-4xl text-up' : 'text-2xl'}`}>{money(price)}</span>
      <span className={`${big ? 'text-base' : 'text-sm'} text-dim line-through`}>{money(was)}</span>
      {was > price && <span className="rounded bg-down/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-down">-{Math.round((1 - price / was) * 100)}%</span>}
    </div>
  );
}

export function useProgress(c: Course) {
  const done = useStore((s) => s.progress[c.slug]);
  const total = openLessons(c).length;
  const n = (done ?? []).filter((id) => openLessons(c).some((l) => l.id === id)).length;
  return { done: done ?? [], n, total, pct: total ? Math.round((n / total) * 100) : 0 };
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-up transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CourseCard({ c }: { c: Course }) {
  const owned = useOwned().has(c.slug);
  const who = INSTRUCTORS[c.instructor];
  return (
    <Link to={`courses/${c.slug}`} className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition duration-300 hover:-translate-y-1 hover:border-up/50 hover:shadow-[0_12px_40px_rgba(47,217,138,0.08)]">
      <div className="relative">
        <Photo scene={c.scene} className="aspect-[16/10] rounded-none border-0 [&_img]:transition [&_img]:duration-700 group-hover:[&_img]:scale-105" badge={false} />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <PlayCircle size={44} className="text-white drop-shadow-lg" />
        </div>
        {c.badge && <span className="absolute left-3 top-3 rounded bg-up px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-bg">{c.badge}</span>}
        {owned && <span className="absolute right-3 top-3 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-up"><BadgeCheck size={11} /> Owned</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="font-mono text-[10px] uppercase tracking-wider text-dim">{c.category} · {c.level}</div>
        <div className="mt-1.5 font-display text-lg font-bold leading-snug group-hover:text-up">{c.title}</div>
        <div className="mt-1.5 line-clamp-2 text-[13px] text-mute">{c.subtitle}</div>
        <div className="mt-2 text-[12px] text-dim">{who.name}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mute">
          <span className="flex items-center gap-1.5">
            <span className="font-bold text-warn">{c.rating.toFixed(1)}</span> <Stars size={10} n={c.rating} /> <span className="text-dim">({c.ratings.toLocaleString()})</span>
          </span>
          <span className="flex items-center gap-1"><Users size={11} /> {c.students}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {c.length.split(' (')[0]}</span>
        </div>
        <div className="mt-auto pt-4">
          {owned ? <span className="text-sm font-semibold text-up">Go to course →</span> : <Price price={c.price} was={c.was} />}
        </div>
      </div>
    </Link>
  );
}
