import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Award, Check, ChevronRight, Circle, Lock, Pause, Play } from 'lucide-react';
import { allLessons, courseBySlug, INSTRUCTORS } from '../data';
import { go, Link } from '../router';
import { actions, useOwned, useStore } from '../store';
import { Photo, Price, ProgressBar, useProgress } from '../ui';

const CAPTIONS = [
  'okay so before we start, smash that like button',
  'this is the exact setup I used on my funded account',
  'see how price respected my level here? textbook',
  'I would have taken this, I just wasn’t filming',
  'if you’re not getting this, rewatch it. or buy 2.0',
];

export default function Learn({ slug, lesson }: { slug: string; lesson?: string }) {
  const c = courseBySlug(slug);
  const owned = useOwned();
  const name = useStore((s) => s.name);
  const cart = useStore((s) => s.cart);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const timer = useRef<number>();

  const lessons = c ? allLessons(c) : [];
  const progress = useProgress(c ?? courseBySlug('larp-model')!);
  const firstOpen = lessons.find((l) => !l.locked && !progress.done.includes(l.id)) ?? lessons[0];
  const current = lessons.find((l) => l.id === lesson) ?? firstOpen;
  const idx = current ? lessons.indexOf(current) : -1;
  const next = lessons[idx + 1];

  // pin the URL to a lesson, so completing it doesn't jump to the next unfinished one
  useEffect(() => {
    if (c && current && lesson !== current.id) window.location.replace(`#/learn/${c.slug}/${current.id}`);
  }, [c, current, lesson]);

  // reset the fake player when the lesson changes
  useEffect(() => {
    setPlaying(false);
    setT(0);
  }, [current?.id]);

  useEffect(() => {
    if (!playing || !c || !current) return;
    timer.current = window.setInterval(() => setT((x) => Math.min(100, x + 2)), 100);
    return () => window.clearInterval(timer.current);
  }, [playing, c, current]);

  // "video" finished: mark the lesson complete
  useEffect(() => {
    if (t < 100 || !playing || !c || !current || current.id !== lesson) return;
    setPlaying(false);
    actions.completeLesson(c.slug, current.id);
  }, [t, playing, c, current]);

  if (!c || !current) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Course not found</h1>
        <Link to="library" className="mt-6 inline-block text-up">My courses →</Link>
      </div>
    );
  }

  if (!owned.has(c.slug)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Lock size={32} className="mx-auto text-warn" />
        <h1 className="mt-4 font-display text-2xl font-bold">You don’t own this course (yet)</h1>
        <p className="mt-2 text-mute">The first step to being funded is buying the thing.</p>
        <Link to={`courses/${c.slug}`} className="mt-6 inline-block rounded-xl bg-up px-6 py-3 text-sm font-bold text-bg">View course</Link>
      </div>
    );
  }

  const done = progress.done.includes(current.id);
  const upsell = c.upsellTo ? courseBySlug(c.upsellTo) : undefined;
  const upsellOwned = upsell ? owned.has(upsell.slug) : false;
  const who = INSTRUCTORS[c.instructor];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <Link to="library" className="flex items-center gap-1.5 text-[12px] text-mute hover:text-ink">
        <ArrowLeft size={13} /> My courses
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-bold md:text-3xl">{c.title}</h1>
        <div className="w-full max-w-xs">
          <div className="mb-1.5 flex justify-between text-[12px] text-mute">
            <span>Your progress</span>
            <span>{progress.pct}%</span>
          </div>
          <ProgressBar pct={progress.pct} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {/* player */}
          {current.locked && !upsellOwned ? (
            <div className="relative overflow-hidden rounded-2xl border border-warn/40">
              <Photo scene={c.scene} className="aspect-video rounded-none border-0 opacity-30 blur-sm" badge={false} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Lock size={36} className="text-warn" />
                <div className="mt-3 font-display text-xl font-bold">This lesson is locked</div>
                <p className="mt-1 max-w-sm text-sm text-mute">{current.takeaway} You bought the course, but not the ending.</p>
                {upsell && (
                  <div className="mt-5 flex flex-col items-center gap-3">
                    <div className="text-sm">
                      Unlock with <span className="font-semibold">{upsell.title}</span>
                    </div>
                    <Price price={upsell.price} was={upsell.was} />
                    <button
                      onClick={() => {
                        actions.addToCart(upsell.slug);
                        go('checkout');
                      }}
                      className="rounded-xl bg-warn px-6 py-3 text-sm font-bold text-bg hover:brightness-110"
                    >
                      {cart.includes(upsell.slug) ? 'Checkout' : 'Unlock now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-line2 bg-black">
              <Photo scene={c.scene} className={`aspect-video rounded-none border-0 transition ${playing ? 'opacity-70' : 'opacity-40'}`} />
              <button onClick={() => setPlaying((p) => !p)} className="absolute inset-0 grid place-items-center" aria-label={playing ? 'Pause' : 'Play'}>
                {!playing && (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-up text-bg shadow-[0_0_40px_rgba(47,217,138,0.4)]">
                    <Play size={28} fill="currentColor" />
                  </span>
                )}
              </button>
              {playing && (
                <div className="pointer-events-none absolute inset-x-0 bottom-14 text-center">
                  <span className="rounded bg-black/75 px-2 py-1 text-sm">{CAPTIONS[Math.floor(t / 20) % CAPTIONS.length]}</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8">
                <button onClick={() => setPlaying((p) => !p)} className="text-white">
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full bg-up" style={{ width: `${done && !playing && t === 0 ? 100 : t}%` }} />
                </div>
                <span className="font-mono text-[11px] text-white/70">{current.mins}:00</span>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] text-dim">Lesson {idx + 1} of {lessons.length}</div>
              <h2 className="mt-1 font-display text-xl font-bold">{current.title}</h2>
              <div className="mt-1 text-[13px] text-mute">with {who.name}</div>
            </div>
            <div className="flex gap-2">
              {!(current.locked && !upsellOwned) && (
                <button
                  onClick={() => actions.toggleLesson(c.slug, current.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold ${done ? 'border-up/50 bg-up/10 text-up' : 'border-line2 hover:bg-panel2'}`}
                >
                  <Check size={14} /> {done ? 'Completed' : 'Mark complete'}
                </button>
              )}
              {next && (
                <button onClick={() => go(`learn/${c.slug}/${next.id}`)} className="flex items-center gap-1 rounded-lg bg-up px-3 py-2 text-[13px] font-bold text-bg hover:brightness-110">
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-panel p-5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-up">Key takeaway</div>
            <p className="mt-2 text-[15px]">{current.takeaway}</p>
          </div>

          {progress.pct === 100 && (
            <div className="mt-6 rounded-2xl border-2 border-warn/50 bg-gradient-to-br from-warn/10 to-panel p-8 text-center">
              <Award size={36} className="mx-auto text-warn" />
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-mute">Certificate of completion</div>
              <div className="mt-3 text-sm text-mute">This certifies that</div>
              <div className="mt-1 font-display text-2xl font-bold">{name || 'Future Funded Trader'}</div>
              <div className="mt-1 text-sm text-mute">has completed</div>
              <div className="mt-1 font-display text-lg font-bold text-up">{c.title}</div>
              <div className="mt-4 font-mono text-[10px] text-dim">Signed, {who.name} · Accredited by: nobody · Worth: about as much as a sim funded certificate</div>
            </div>
          )}
        </div>

        {/* curriculum sidebar */}
        <aside className="h-fit overflow-hidden rounded-2xl border border-line bg-panel lg:sticky lg:top-24">
          {c.modules.map((m) => (
            <div key={m.title} className="border-b border-line last:border-0">
              <div className="bg-panel2 px-4 py-2.5 text-[12px] font-semibold">{m.title}</div>
              <ul>
                {m.lessons.map((l) => {
                  const isDone = progress.done.includes(l.id);
                  const isCur = l.id === current.id;
                  const locked = l.locked && !upsellOwned;
                  return (
                    <li key={l.id}>
                      <Link to={`learn/${c.slug}/${l.id}`} className={`flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-panel2 ${isCur ? 'bg-up/10 text-up' : ''}`}>
                        {locked ? <Lock size={14} className="shrink-0 text-warn" /> : isDone ? <Check size={14} className="shrink-0 text-up" /> : <Circle size={14} className="shrink-0 text-dim" />}
                        <span className="flex-1">{l.title}</span>
                        <span className="font-mono text-[10px] text-dim">{l.mins ? `${l.mins}m` : 'TBA'}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
