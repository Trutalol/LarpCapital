import { ReactNode, useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Check, ChevronDown, Clock, PlayCircle, Star, Timer, Users } from 'lucide-react';
import Checkout, { Product } from './Checkout';
import { LARPCAPITAL_URL, Scene, sceneImage } from './api';

const COURSES = [
  {
    tag: 'Beginner',
    name: 'Larp Starter',
    blurb: 'Everything you need to start losing money confidently.',
    hours: '2 hrs of video',
    features: ['What is a candle (it’s a rectangle)', 'Drawing lines until one works', 'Setting up your first eval to fail', 'Intro to the Discord'],
    price: 297,
    was: 997,
  },
  {
    tag: 'Most popular',
    name: 'The Larp Model™',
    blurb: 'My exact A+ setup. The one that allegedly makes 5 figures a month.',
    hours: '3 hrs of recorded Zoom calls',
    features: ['The full 5-step A+ strategy', 'Daily “live” recaps (posted after the close)', 'A+ checklist PDF (1 page, mostly logo)', 'Private Discord (2,400 members, 4 active)', 'Mindset module: manifesting green days'],
    price: 997,
    was: 4997,
    featured: true,
  },
  {
    tag: 'Elite',
    name: 'Larp Mastermind',
    blurb: 'Fly to Dubai, sit in a rented penthouse, watch me not trade.',
    hours: '3 days in person',
    features: ['Everything in The Larp Model™', 'Group photo with the rented Lambo', 'Weekly 1-on-1 (with my cousin)', 'Funded Guarantee™ (not a guarantee)', 'Your name on the website, briefly'],
    price: 4997,
    was: 14997,
  },
];

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
  ['Is this real?', 'No. It’s a parody made for a hackathon alongside LarpCapital. Nothing here can take your money.'],
  ['Did Chase really make 5 figures a month?', 'On a simulated paper account, during one good week, at 60x replay speed. So: allegedly.'],
  ['Are those his cars and houses?', 'They’re nobody’s. Every photo on this site is AI-generated.'],
  ['What if the strategy doesn’t work for me?', 'Then you didn’t follow the model. (Real gurus say this. Be suspicious of it.)'],
  ['Do you offer refunds?', 'All sales are final, which is easy when there are no sales.'],
];

function Logo() {
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

function Countdown() {
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
function Photo({ scene, caption, className = '' }: { scene: Scene; caption?: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    sceneImage(scene).then(setSrc);
  }, [scene]);
  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-line2 bg-panel ${className}`}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-panel2" />}
      <span className="absolute right-2 top-2 rounded-sm bg-black/50 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-ink/70">AI image · parody</span>
      {caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10 text-sm text-ink">{caption}</figcaption>}
    </figure>
  );
}

function Stars({ size = 12 }: { size?: number }) {
  return (
    <div className="flex text-warn">
      {[...Array(5)].map((_, i) => <Star key={i} size={size} fill="currentColor" />)}
    </div>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-up">{kicker}</div>
      <h2 className="mt-3 font-display text-2xl font-bold leading-tight md:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] text-mute">{sub}</p>}
    </div>
  );
}

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function App() {
  const [buying, setBuying] = useState<Product | null>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const flagship = COURSES.find((c) => c.featured)!;
  const buy = (c: (typeof COURSES)[number] = flagship) => setBuying({ name: c.name, price: c.price });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="flex items-center justify-center gap-2 bg-up px-4 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-bg">
        <Timer size={12} className="shrink-0" /> Enrollment closes in <Countdown /> · only 3 spots left (there are always 3)
      </div>

      <nav className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-[13px] text-mute md:flex">
            <a href="#courses" className="hover:text-ink">Courses</a>
            <a href="#strategy" className="hover:text-ink">A+ Strategy</a>
            <a href="#results" className="hover:text-ink">Results</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <a href={LARPCAPITAL_URL} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-mute hover:text-ink sm:flex">
              <ArrowLeft size={13} /> LarpCapital
            </a>
            <button onClick={() => buy()} className="rounded-lg bg-up px-4 py-2 text-xs font-bold text-bg hover:brightness-110">
              Enroll now
            </button>
          </div>
        </div>
      </nav>

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
              Learn The Larp Model™, the A+ setup I used to go from broke to <span className="font-semibold text-ink">$13,000/month*</span> trading NQ for 15 minutes a day.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => buy()} className="rounded-xl bg-up px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg shadow-[0_0_40px_rgba(47,217,138,0.25)] hover:brightness-110">
                Buy the course
              </button>
              <a href="#strategy" className="flex items-center gap-2 rounded-xl border border-line2 px-5 py-3.5 text-sm font-semibold hover:bg-panel2">
                <PlayCircle size={16} /> See the A+ strategy
              </a>
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

      {/* courses */}
      <section id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-8">
        <SectionHead kicker="Trading courses" title="Pick your path to funded" sub="Three courses. One strategy. Several upsells." />
        <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
          {COURSES.map((c) => (
            <div key={c.name} className={`relative flex h-full flex-col rounded-2xl border p-6 ${c.featured ? 'border-up/60 bg-gradient-to-b from-up/10 to-panel shadow-[0_0_60px_rgba(47,217,138,0.08)]' : 'border-line bg-panel'}`}>
              <span className={`self-start rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${c.featured ? 'border-up/50 bg-up/15 text-up' : 'border-line2 bg-panel2 text-mute'}`}>{c.tag}</span>
              <div className="mt-4 font-display text-xl font-bold">{c.name}</div>
              <div className="mt-2 text-[13px] text-mute">{c.blurb}</div>
              <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-dim">
                <Clock size={12} /> {c.hours}
              </div>
              <ul className="mt-5 flex-1 space-y-2 text-[13px]">
                {c.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-up" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-2 border-t border-line pt-5">
                <span className="font-display text-3xl font-bold">{money(c.price)}</span>
                <span className="text-sm text-dim line-through">{money(c.was)}</span>
              </div>
              <button
                onClick={() => buy(c)}
                className={`mt-4 rounded-xl py-3 text-sm font-bold transition ${c.featured ? 'bg-up text-bg hover:brightness-110' : 'border border-line2 bg-panel2 hover:bg-[#1c1e23]'}`}
              >
                Buy {c.name}
              </button>
            </div>
          ))}
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
          <SectionHead kicker="Results" title={<>The lifestyle the model funds</>} sub="Results not typical. Or real." />
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
          <p className="mx-auto mt-3 max-w-md text-[15px] text-mute">Or several courses. We have three. And a mastermind.</p>
          <div className="mt-8 flex items-baseline justify-center gap-3">
            <span className="text-xl text-dim line-through">{money(flagship.was)}</span>
            <span className="font-display text-5xl font-bold text-up">{money(flagship.price)}</span>
          </div>
          <button onClick={() => buy()} className="mt-6 rounded-xl bg-up px-8 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-bg shadow-[0_0_40px_rgba(47,217,138,0.25)] hover:brightness-110">
            Buy The Larp Model™
          </button>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <Logo />
          <div className="max-w-2xl text-[12px] leading-relaxed text-dim">
            Larp Academy is a parody of trading-course funnels, made for a hackathon alongside{' '}
            <a href={LARPCAPITAL_URL} className="text-mute underline hover:text-ink">LarpCapital</a>, a simulated prop firm. No course exists, nothing is for sale, no payment can be taken, every image is AI-generated and every person is made up. Not financial advice.
          </div>
        </div>
      </footer>

      {buying && <Checkout product={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}
