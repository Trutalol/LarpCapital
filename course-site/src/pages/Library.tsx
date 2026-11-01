import { useState } from 'react';
import { BookOpen, Trophy } from 'lucide-react';
import { COURSES, money } from '../data';
import { go, Link } from '../router';
import { actions, useOwned, useStore } from '../store';
import { Photo, ProgressBar, useProgress } from '../ui';
import type { Course } from '../data';

function OwnedCard({ c }: { c: Course }) {
  const p = useProgress(c);
  return (
    <button onClick={() => go(`learn/${c.slug}`)} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel text-left transition hover:border-up/50">
      <Photo scene={c.scene} className="aspect-[16/9] rounded-none border-0" badge={false} />
      <div className="flex flex-1 flex-col p-4">
        <div className="font-semibold group-hover:text-up">{c.title}</div>
        <div className="mt-auto pt-4">
          <ProgressBar pct={p.pct} />
          <div className="mt-2 flex items-center justify-between text-[12px] text-mute">
            <span>{p.n}/{p.total} lessons</span>
            {p.pct === 100 ? <span className="flex items-center gap-1 font-semibold text-warn"><Trophy size={12} /> Completed</span> : <span>{p.n ? 'Continue' : 'Start'} →</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Library() {
  const owned = useOwned();
  const orders = useStore((s) => s.orders);
  const courses = COURSES.filter((c) => owned.has(c.slug) && !c.includes);
  const [sure, setSure] = useState(false);
  const spent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-up">Student dashboard</div>
          <h1 className="mt-2 font-display text-3xl font-bold">My courses</h1>
        </div>
        {orders.length > 0 && (
          <div className="rounded-xl border border-line bg-panel px-4 py-2 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-dim">Lifetime “spend”</div>
            <div className="font-display text-xl font-bold">{money(spent)} <span className="text-[12px] font-normal text-up">($0 real)</span></div>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-panel px-6 py-16 text-center">
          <BookOpen size={32} className="mx-auto text-dim" />
          <div className="mt-4 font-semibold">No courses yet</div>
          <p className="mt-1 text-sm text-mute">Every day without a course is a day of not being funded (allegedly).</p>
          <Link to="courses" className="mt-6 inline-block rounded-xl bg-up px-6 py-3 text-sm font-bold text-bg hover:brightness-110">Browse courses</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => (
            <OwnedCard key={c.slug} c={c} />
          ))}
        </div>
      )}

      {orders.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-lg font-bold">Order history</h2>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel text-sm">
            {orders.map((o) => (
              <Link key={o.id} to={`order/${o.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-panel2">
                <span className="font-mono text-[12px] text-mute">{o.id}</span>
                <span className="hidden flex-1 truncate text-mute sm:block">{o.items.length} course{o.items.length > 1 ? 's' : ''} · {new Date(o.at).toLocaleDateString()}</span>
                <span className="font-mono">{money(o.total)}</span>
              </Link>
            ))}
          </div>
          <button onClick={() => (sure ? actions.reset() : setSure(true))} className={`mt-4 text-[12px] hover:text-down ${sure ? 'text-down' : 'text-dim'}`}>
            {sure ? 'Click again to wipe all purchases and progress' : 'Reset purchases and progress (it’s all fake anyway)'}
          </button>
        </div>
      )}
    </div>
  );
}
