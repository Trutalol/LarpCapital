import { useState } from 'react';
import { ArrowRight, BadgeCheck, ChevronDown, PlayCircle, Users } from 'lucide-react';
import { COURSES, courseBySlug, money } from '../data';
import { go, Link } from '../router';
import { CourseCard, Photo, SectionHead, Stars } from '../ui';

const STEPS = [
  ['Mark the Asia range', 'Draw the Asia high and low. Do not ask why. Asking why is a beginner mindset.'],
  ['Wait for the 9:47 sweep', 'Price must take out the London low between 9:45 and 9:48 EST, into the 4H fair value gap. 9:49 is a different course (sold separately).'],
  ['Confirm the CISD', 'Change in state of delivery on the 1-minute. Or the 3-minute, whichever looks better afterwards.'],
  ['Enter on the order block', 'Ideally while filming. A trade that isn’t recorded doesn’t count toward the monthly number.'],
  ['Manage like a pro', 'Stop below the swing low, unless it would get hit, in which case move it. Screenshot at the high. Close the app.'],
];

const STORIES = [
  { name: 'Marcus', age: 27, result: 'Lambo on order', quote: 'My Lambo is on order. The order is a limit order. It has not filled.' },
  { name: 'Brayden', age: 22, result: '3 evals passed', quote: 'Passed 3 evals and breached 11. Net positive vibes. The 9:47 sweep changed my life.' },
  { name: 'Jaden', age: 19, result: 'Quit his job', quote: 'Quit my job at Chipotle after week one. Rehired week three. Still bullish.' },
  { name: 'Kaitlyn', age: 24, result: '$1,354 payout', quote: 'Got my first payout certificate! Printed it, framed it, the eval fees were $1,900.' },
  { name: 'Tyler', age: 20, result: 'Knows what an FVG is', quote: 'I finally understand fair value gaps. I still lose money, but knowledgeably.' },
  { name: 'Devon', age: 31, result: 'Funded ×6', quote: 'Funded six times this year. That’s six times I had to buy it again.' },
];

const AS_SEEN = ['My Group Chat', 'A Discord Server', 'TikTok For You Page', 'My Mom’s Facebook', 'r/wallstreetbets (removed)'];

const FAQ = [
  ['Is this real?', 'No. It’s a parody made for a hackathon alongside LarpCapital. Nothing here can take your money: checkout has no card fields and never charges anything.'],
  ['Did Chase really make 5 figures a month?', 'On a simulated paper account, during one good week, at 60x replay speed. So: allegedly.'],
  ['Are those his cars and houses?', 'They’re nobody’s. Every photo on this site is AI-generated.'],
  ['What happens when I "buy" a course?', 'It shows up in My Courses (saved in your browser), with lessons you can tick off. The last lesson is always locked behind another course. That part is very realistic.'],
  ['What if the strategy doesn’t work for me?', 'Then you didn’t follow the model. (Real gurus say this. Be suspicious of it.)'],
  ['Do you offer refunds?', 'All sales are final, which is easy when there are no sales.'],
];

const FEATURED = ['larp-model', 'funded-in-7', 'lifestyle-content'];

export default function Home() {
  const [faq, setFaq] = useState<number | null>(0);
  const flagship = courseBySlug('larp-model')!;
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      {/* hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(47,217,138,0.12),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 md:grid-cols-2 md:px-8 md:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-up/40 bg-up/10 px-3 py-1 text-[11px] font-semibold text-up">
              <BadgeCheck size={13} /> Taught by a LarpCapital Funded Trader™
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              Trade like a <span className="text-up">5-figure</span> trader.
              <br />
              <span className="text-mute">Allegedly.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mute">
              {COURSES.length} courses, one strategy, several upsells. Start with The Larp Model™, the A+ setup I used to go from broke to <span className="font-semibold text-ink">$13,000/month*</span> trading NQ for 15 minutes a day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="courses" className="rounded-xl bg-up px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg shadow-[0_0_40px_rgba(47,217,138,0.25)] hover:brightness-110">
                Browse courses
              </Link>
              <button onClick={() => scrollTo('strategy')} className="flex items-center gap-2 rounded-xl border border-line2 px-5 py-3.5 text-sm font-semibold hover:bg-panel2">
                <PlayCircle size={16} /> See the A+ strategy
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-mute">
              <span className="flex items-center gap-2"><Stars /> 4.9 (from 3 reviews, all mine)</span>
              <span className="flex items-center gap-1.5"><Users size={13} /> 12,000+ students*</span>
            </div>
            <div className="mt-3 font-mono text-[10px] text-dim">*simulated paper account · one good week · 60x replay speed · “students” includes Discord bots</div>
          </div>
          <Photo scene="lambo" caption="Morning commute. (Rented for the photo. Also, AI.)" className="aspect-[4/3]" />
        </div>
      </section>

      {/* as seen on */}
      <div className="border-y border-line bg-panel/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-dim">As seen on</span>
          {AS_SEEN.map((s) => (
            <span key={s} className="font-display text-[13px] font-semibold text-mute">{s}</span>
          ))}
        </div>
      </div>

      {/* featured courses */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <SectionHead kicker="Featured courses" title="Pick your path to funded" sub="Hand-picked by me, from my courses, for you." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURED.map((s) => (
            <CourseCard key={s} c={courseBySlug(s)!} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="courses" className="inline-flex items-center gap-2 rounded-xl border border-line2 px-5 py-3 text-sm font-semibold hover:bg-panel2">
            See all {COURSES.length} courses <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* strategy */}
      <section id="strategy" className="scroll-mt-20 border-y border-line bg-[#0b0c0e]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <SectionHead kicker="Inside The Larp Model™" title="My A+ strategy, step by step" sub="This is the exact setup. Paying $997 to read it again in a PDF is optional, but recommended." />
          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {STEPS.map(([title, body], i) => (
              <div key={title} className="rounded-2xl border border-line bg-panel p-5">
                <div className="font-display text-3xl font-bold text-up/80">{String(i + 1).padStart(2, '0')}</div>
                <div className="mt-3 text-sm font-semibold">{title}</div>
                <div className="mt-2 text-[13px] leading-relaxed text-mute">{body}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-panel p-6 md:grid-cols-4">
            {[
              ['$13,000', 'per month*'],
              ['94%', 'win rate (green days only)'],
              ['15 min', 'per day (+6 hrs of content)'],
              ['3', 'spots left, forever'],
            ].map(([v, k]) => (
              <div key={k}>
                <div className="font-display text-2xl font-bold text-up md:text-3xl">{v}</div>
                <div className="mt-1 text-[12px] text-mute">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* instructor */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-8">
        <Photo scene="penthouse" caption="Chase’s office. Trading 15 min/day, posing 6 hrs/day." className="aspect-[4/5] md:order-2" />
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-up">Meet your instructor</div>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">Chase Larpington</h2>
          <div className="mt-1 text-sm text-mute">Founder, Larp Academy · LarpCapital Funded Trader™</div>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-mute">
            <p>Three years ago I was broke, sleeping on my friend’s couch, blowing evals. Then I discovered the 9:47 sweep. Everything changed. (I moved to a different friend’s couch.)</p>
            <p>Today I trade 15 minutes a day from wherever the Lambo rental place will deliver. I hold 6 LarpCapital funded certificates, which I want to stress are simulated, and I’ve decided to share everything with you for a small fee.</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              ['6', 'funded certs (sim)'],
              ['$1,354', 'actual payouts'],
              ['14', 'evals breached'],
            ].map(([v, k]) => (
              <div key={k} className="rounded-xl border border-line bg-panel p-3">
                <div className="font-display text-xl font-bold">{v}</div>
                <div className="mt-0.5 text-[11px] text-mute">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* results */}
      <section id="results" className="scroll-mt-20 border-y border-line bg-[#0b0c0e]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">
          <SectionHead kicker="Results" title="The lifestyle the model funds" sub="Results not typical. Or real." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Photo scene="dubai" caption="Tax residency: vibes." className="aspect-[4/5]" />
            <Photo scene="yacht" caption="Yacht (booked for 1 hour, 50 min spent filming)." className="aspect-[4/5]" />
            <Photo scene="jet" caption="Private jet. Parked. We didn’t go anywhere." className="aspect-[4/5]" />
          </div>

          <h3 className="mt-20 text-center font-display text-xl font-bold md:text-2xl">Student success stories</h3>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STORIES.map((s) => (
              <div key={s.name} className="flex flex-col rounded-2xl border border-line bg-panel p-5">
                <div className="flex items-center justify-between">
                  <Stars />
                  <span className="rounded border border-up/40 bg-up/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-up">{s.result}</span>
                </div>
                <div className="mt-3 flex-1 text-[14px] leading-snug">“{s.quote}”</div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-line2 bg-bg font-display text-sm text-up">{s.name[0]}</div>
                  <div>
                    <div className="text-[13px] font-semibold">{s.name}, {s.age}</div>
                    <div className="font-mono text-[9px] text-dim/80">fictional</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 md:px-8">
        <SectionHead kicker="FAQ" title="Questions? Allegedly answered." />
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-panel">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold">
                {q}
                <ChevronDown size={16} className={`shrink-0 text-dim transition ${faq === i ? 'rotate-180' : ''}`} />
              </button>
              {faq === i && <div className="px-5 pb-4 text-sm text-mute">{a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* final cta */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-up/40 bg-gradient-to-br from-up/15 via-panel to-panel px-6 py-14 text-center md:px-12">
          <h2 className="font-display text-2xl font-bold md:text-4xl">Your Lambo is one course away.</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-mute">Or several courses. We have {COURSES.length}. And a mastermind.</p>
          <div className="mt-8 flex items-baseline justify-center gap-3">
            <span className="text-xl text-dim line-through">{money(flagship.was)}</span>
            <span className="font-display text-5xl font-bold text-up">{money(flagship.price)}</span>
          </div>
          <button onClick={() => go(`courses/${flagship.slug}`)} className="mt-6 rounded-xl bg-up px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg shadow-[0_0_40px_rgba(47,217,138,0.25)] hover:brightness-110">
            Get The Larp Model™
          </button>
        </div>
      </section>
    </>
  );
}
