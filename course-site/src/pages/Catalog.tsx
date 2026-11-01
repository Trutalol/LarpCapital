import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES, COURSES } from '../data';
import { go } from '../router';
import { CourseCard } from '../ui';
import { Reveal } from '../motion';

type Sort = 'popular' | 'price-asc' | 'price-desc' | 'discount';

export default function Catalog({ category }: { category?: string }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('popular');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = COURSES.filter((c) => (!category || c.category === category) && (!needle || `${c.title} ${c.subtitle} ${c.category}`.toLowerCase().includes(needle)));
    if (sort === 'price-asc') out.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') out.sort((a, b) => b.price - a.price);
    if (sort === 'discount') out.sort((a, b) => b.was - b.price - (a.was - a.price));
    return out;
  }, [category, q, sort]);

  const chip = (label: string, value?: string) => {
    const on = category === value;
    return (
      <button
        key={label}
        onClick={() => go(value ? `courses?category=${encodeURIComponent(value)}` : 'courses')}
        className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${on ? 'border-up/60 bg-up/15 text-up' : 'border-line2 text-mute hover:text-ink'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-up">Course catalog</div>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">{category ?? 'All courses'}</h1>
      <p className="mt-2 text-[15px] text-mute">Every course teaches the same strategy from a slightly different angle, priced accordingly.</p>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {chip('All')}
          {CATEGORIES.map((c) => chip(c, c))}
        </div>
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-line2 bg-panel px-3 py-2 md:w-56 md:flex-none">
            <Search size={14} className="text-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses" className="w-full bg-transparent text-sm outline-none placeholder:text-dim" />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-line2 bg-panel px-3 py-2 text-sm text-mute outline-none">
            <option value="popular">Most hyped</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="discount">Biggest fake discount</option>
          </select>
        </div>
      </div>

      {list.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <Reveal key={`${category}-${c.slug}`} delay={(i % 3) * 90} className="flex">
              <CourseCard c={c} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center text-sm text-mute">No courses match. Chase is recording one about it now.</div>
      )}
    </div>
  );
}
