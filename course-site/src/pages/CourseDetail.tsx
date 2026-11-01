import { useState } from 'react';
import { BadgeCheck, Check, ChevronDown, Clock, Infinity as InfinityIcon, Lock, PlayCircle, ShoppingCart, Smartphone, Timer, Trophy, Users } from 'lucide-react';
import { allLessons, courseBySlug, COURSES, INSTRUCTORS, totalMins } from '../data';
import { go, Link } from '../router';
import { actions, useOwned, useStore } from '../store';
import { Avatar, Countdown, CourseCard, Photo, Price, Stars } from '../ui';

const fmtMins = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

export default function CourseDetail({ slug }: { slug: string }) {
  const c = courseBySlug(slug);
  const owned = useOwned();
  const cart = useStore((s) => s.cart);
  const [open, setOpen] = useState<number | null>(0);

  if (!c) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Course not found</h1>
        <p className="mt-2 text-mute">It was probably rebranded. Again.</p>
        <Link to="courses" className="mt-6 inline-block text-up">Browse courses →</Link>
      </div>
    );
  }

  const who = INSTRUCTORS[c.instructor];
  const isOwned = owned.has(c.slug);
  const inCart = cart.includes(c.slug);
  const lessons = c.includes ? c.includes.flatMap((s) => allLessons(courseBySlug(s)!)) : allLessons(c);
  const mins = c.includes ? c.includes.reduce((s, x) => s + totalMins(courseBySlug(x)!), 0) : totalMins(c);
  const related = COURSES.filter((x) => x.slug !== c.slug && (x.category === c.category || x.slug === c.upsellTo)).slice(0, 3);

  const buyNow = () => {
    actions.addToCart(c.slug);
    go('checkout');
  };

  return (
    <>
      {/* header */}
      <section className="border-b border-line bg-[#0b0c0e]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1fr_360px] md:px-8">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-dim">
              <Link to="courses" className="hover:text-ink">Courses</Link> /
              <Link to={`courses?category=${encodeURIComponent(c.category)}`} className="hover:text-ink">{c.category}</Link>
            </div>
            {c.badge && <span className="mt-4 inline-block rounded bg-up px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-bg">{c.badge}</span>}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-5xl">{c.title}</h1>
            <p className="mt-4 max-w-xl text-[16px] text-mute">{c.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-mute">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-warn">{c.rating.toFixed(1)}</span> <Stars n={c.rating} /> ({c.ratings.toLocaleString()} ratings)
              </span>
              <span className="flex items-center gap-1.5"><Users size={14} /> {c.students} students</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {c.length}</span>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Avatar initial={who.initial} size={32} />
              <div className="text-[13px]">
                <div className="font-semibold">{who.name}</div>
                <div className="text-dim">{who.title}</div>
              </div>
            </div>
          </div>

          {/* buy box */}
          <div className="md:row-span-2">
            <div className="overflow-hidden rounded-2xl border border-line2 bg-panel md:sticky md:top-24">
              <div className="relative">
                <Photo scene={c.scene} className="aspect-video rounded-none border-0" />
                <div className="absolute inset-0 grid place-items-center">
                  <PlayCircle size={52} className="text-white/90 drop-shadow-lg" />
                </div>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-[11px]">Preview this course (it’s a photo)</span>
              </div>
              <div className="p-5">
                {isOwned ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-semibold text-up"><BadgeCheck size={16} /> You own this course</div>
                    <button onClick={() => go(c.includes ? 'library' : `learn/${c.slug}`)} className="mt-4 w-full rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg hover:brightness-110">
                      {c.includes ? 'Open my courses' : 'Go to course'}
                    </button>
                  </>
                ) : (
                  <>
                    <Price price={c.price} was={c.was} big />
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-down">
                      <Timer size={13} /> Price goes up in <Countdown /> (it doesn’t)
                    </div>
                    <button onClick={buyNow} className="la-shine la-glow mt-4 w-full rounded-xl bg-up py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg shadow-[0_0_40px_rgba(47,217,138,0.2)] hover:brightness-110">
                      {c.price === 0 ? 'Enroll free' : 'Buy now'}
                    </button>
                    <button
                      onClick={() => (inCart ? go('cart') : actions.addToCart(c.slug))}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line2 bg-panel2 py-3 text-sm font-semibold hover:bg-[#1c1e23]"
                    >
                      <ShoppingCart size={15} /> {inCart ? 'In cart · view cart' : 'Add to cart'}
                    </button>
                    <div className="mt-2 text-center text-[11px] text-dim">30-day money-back guarantee*</div>
                  </>
                )}
                <div className="mt-5 space-y-2 border-t border-line pt-4 text-[12px] text-mute">
                  <div className="font-semibold text-ink">This course includes</div>
                  <div className="flex items-center gap-2"><PlayCircle size={13} /> {lessons.length} lessons · {fmtMins(mins)} of “content”</div>
                  <div className="flex items-center gap-2"><InfinityIcon size={13} /> Lifetime access (lifetime of the Discord)</div>
                  <div className="flex items-center gap-2"><Smartphone size={13} /> Watch on mobile, in the car you rented</div>
                  <div className="flex items-center gap-2"><Trophy size={13} /> Certificate of completion (also sim)</div>
                </div>
                <div className="mt-3 font-mono text-[9px] leading-relaxed text-dim">*the guarantee is that you’ll be asked to buy another course. Parody: nothing here can be bought.</div>
              </div>
            </div>
          </div>

          {/* body (left column) */}
          <div className="space-y-10 md:col-start-1">
            <div className="rounded-2xl border border-line bg-panel p-6">
              <h2 className="font-display text-lg font-bold">What you’ll learn</h2>
              <ul className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
                {c.outcomes.map((o) => (
                  <li key={o} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-up" /> {o}
                  </li>
                ))}
              </ul>
            </div>

            {c.includes ? (
              <div>
                <h2 className="font-display text-lg font-bold">What’s in the bundle</h2>
                <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-panel">
                  {c.includes.map((s) => {
                    const x = courseBySlug(s)!;
                    return (
                      <Link key={s} to={`courses/${s}`} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm hover:bg-panel2">
                        <span className="font-semibold">{x.title}</span>
                        <span className="font-mono text-dim line-through">${x.price.toLocaleString()}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-lg font-bold">Course curriculum</h2>
                <div className="mt-1 text-[13px] text-mute">{c.modules.length} modules · {lessons.length} lessons · {fmtMins(mins)}</div>
                <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
                  {c.modules.map((m, i) => (
                    <div key={m.title}>
                      <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold hover:bg-panel2">
                        <span>{m.title}</span>
                        <span className="flex items-center gap-3 text-[12px] font-normal text-dim">
                          {m.lessons.length} lessons
                          <ChevronDown size={16} className={`transition ${open === i ? 'rotate-180' : ''}`} />
                        </span>
                      </button>
                      {open === i && (
                        <ul className="border-t border-line bg-bg/40 px-5 py-2">
                          {m.lessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-3 py-2 text-[13px]">
                              {l.locked ? <Lock size={14} className="shrink-0 text-warn" /> : <PlayCircle size={14} className="shrink-0 text-dim" />}
                              <span className={`flex-1 ${l.locked ? 'text-mute' : ''}`}>
                                {l.title} {l.locked && <span className="ml-1 rounded bg-warn/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-warn">Upsell</span>}
                              </span>
                              <span className="font-mono text-[11px] text-dim">{l.mins ? `${l.mins}m` : 'TBA'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-line bg-panel p-6">
              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-up">Instructor</div>
              <div className="mt-3 flex items-center gap-4">
                <Avatar initial={who.initial} size={56} />
                <div>
                  <div className="font-display text-lg font-bold">{who.name}</div>
                  <div className="text-[13px] text-mute">{who.title}</div>
                </div>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-mute">
                {who.id === 'chase'
                  ? 'Went from broke to a different friend’s couch in three years. Holds 6 simulated funded certificates and $1,354 in lifetime payouts. Has sold considerably more than that in courses.'
                  : who.id === 'brayden'
                    ? 'Bought The Larp Model™ 11 days ago. Has since passed one evaluation, breached four, and launched this course. The Larp Academy affiliate program pays 40%.'
                    : 'Dr. Vibes has a doctorate in energy from an institution that is also a Discord server. Specialises in reframing losses as “lessons” and lessons as “products”.'}
              </p>
            </div>

            <div>
              <h2 className="font-display text-lg font-bold">Student reviews</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {c.reviews.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-line bg-panel p-5">
                    <Stars n={r.stars} />
                    <div className="mt-3 text-[14px] leading-snug">“{r.text}”</div>
                    <div className="mt-3 text-[12px] text-mute">{r.name} <span className="font-mono text-[9px] text-dim">· fictional</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="font-display text-xl font-bold">Students who bought this also bought</h2>
          <p className="mt-1 text-[13px] text-mute">(Because the last lesson told them to.)</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <CourseCard key={x.slug} c={x} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
