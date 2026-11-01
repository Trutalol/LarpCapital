import type { Scene } from './api';

/** Every course, instructor and review here is made up. That's the point. */

export type Category = 'Strategy' | 'Prop Firms' | 'Mindset' | 'Lifestyle' | 'Bundles';
export const CATEGORIES: Category[] = ['Strategy', 'Prop Firms', 'Mindset', 'Lifestyle', 'Bundles'];

export interface Lesson {
  id: string;
  title: string;
  mins: number;
  /** One-line "key takeaway" shown in the course player. */
  takeaway: string;
  /** Locked behind an upsell even after you buy the course. */
  locked?: boolean;
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Review {
  name: string;
  stars: number;
  text: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  initial: string;
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  level: 'Beginner' | 'Intermediate' | 'Elite' | 'All levels';
  instructor: string;
  price: number;
  was: number;
  scene: Scene;
  rating: number;
  ratings: number;
  students: string;
  length: string;
  badge?: string;
  outcomes: string[];
  modules: Module[];
  reviews: Review[];
  /** Bundles grant these courses too. */
  includes?: string[];
  /** Slug the locked bonus lesson upsells to. */
  upsellTo?: string;
}

export const INSTRUCTORS: Record<string, Instructor> = {
  chase: { id: 'chase', name: 'Chase Larpington', title: 'Founder · LarpCapital Funded Trader™ (sim)', initial: 'C' },
  brayden: { id: 'brayden', name: 'Coach Brayden', title: 'Student → coach in 11 days', initial: 'B' },
  vibes: { id: 'vibes', name: 'Dr. Vibes', title: 'Not that kind of doctor', initial: 'V' },
};

const L = (id: string, title: string, mins: number, takeaway: string, locked = false): Lesson => ({ id, title, mins, takeaway, locked });

export const COURSES: Course[] = [
  {
    slug: 'larp-model',
    title: 'The Larp Model™',
    subtitle: 'My exact A+ setup. The one that allegedly makes 5 figures a month.',
    category: 'Strategy',
    level: 'All levels',
    instructor: 'chase',
    price: 997,
    was: 4997,
    scene: 'chart',
    rating: 4.9,
    ratings: 3,
    students: '12,000+',
    length: '3 hrs of recorded Zoom calls',
    badge: 'Bestseller',
    upsellTo: 'larp-model-2',
    outcomes: [
      'The full 5-step A+ strategy (the 9:47 sweep)',
      'How to find the CISD on whichever timeframe agrees with you',
      'Daily "live" recaps, posted after the close',
      'Private Discord: 2,400 members, 4 active',
      'Mindset module: manifesting green days',
    ],
    modules: [
      {
        title: 'Module 1 · Foundations',
        lessons: [
          L('m1', 'Welcome to the Larp Model™', 6, 'Turn your camera on. Not for the course, for the testimonial.'),
          L('m2', 'Mark the Asia range', 14, 'Draw the Asia high and low. Do not ask why. Asking why is a beginner mindset.'),
          L('m3', 'Why your old strategy failed', 9, 'It wasn’t this one. That’s the whole lesson.'),
        ],
      },
      {
        title: 'Module 2 · The A+ setup',
        lessons: [
          L('m4', 'The 9:47 sweep', 22, 'Price takes the London low between 9:45 and 9:48. 9:49 is a different course.'),
          L('m5', 'Confirming the CISD', 18, '1-minute or 3-minute, whichever looks better afterwards.'),
          L('m6', 'Entering on the order block', 12, 'A trade that isn’t recorded doesn’t count toward the monthly number.'),
        ],
      },
      {
        title: 'Module 3 · Managing like a pro',
        lessons: [
          L('m7', 'Stop placement', 11, 'Below the swing low, unless it would get hit, in which case move it.'),
          L('m8', 'Screenshot at the high', 7, 'The trade is over when the screenshot looks good.'),
          L('m9', 'The secret 6th step', 31, 'Available in The Larp Model™ 2.0.', true),
        ],
      },
    ],
    reviews: [
      { name: 'Brayden, 22', stars: 5, text: 'Passed 3 evals and breached 11. Net positive vibes. The 9:47 sweep changed my life.' },
      { name: 'Tyler, 20', stars: 5, text: 'I finally understand fair value gaps. I still lose money, but knowledgeably.' },
      { name: 'Chase (instructor)', stars: 5, text: 'Honestly one of the best courses I’ve ever made.' },
    ],
  },
  {
    slug: 'larp-starter',
    title: 'Larp Starter',
    subtitle: 'Everything you need to start losing money confidently.',
    category: 'Strategy',
    level: 'Beginner',
    instructor: 'chase',
    price: 297,
    was: 997,
    scene: 'cash-fan',
    rating: 4.8,
    ratings: 41,
    students: '8,400+',
    length: '2 hrs of video',
    upsellTo: 'larp-model',
    outcomes: ['What a candle is (it’s a rectangle)', 'Drawing lines until one works', 'Setting up your first eval to fail', 'An intro to the Discord'],
    modules: [
      {
        title: 'Module 1 · Charts',
        lessons: [
          L('s1', 'What is a candle', 8, 'It’s a rectangle with a stick. Green means you were right.'),
          L('s2', 'Support and resistance', 15, 'Draw lines until price touches one. Then say you called it.'),
          L('s3', 'Timeframes', 10, 'If the 5-minute disagrees with you, check the 15-minute.'),
        ],
      },
      {
        title: 'Module 2 · Your first eval',
        lessons: [
          L('s4', 'Choosing a prop firm', 9, 'Pick the one with a 90% off coupon. They all have one.'),
          L('s5', 'Breaching responsibly', 12, 'Everyone breaches. Breaching is how you know you’re trading.'),
          L('s6', 'What to learn next', 4, 'The Larp Model™. Use code LARP for 0% off.', true),
        ],
      },
    ],
    reviews: [
      { name: 'Jaden, 19', stars: 5, text: 'Quit my job at Chipotle after week one. Rehired week three. Still bullish.' },
      { name: 'Ava, 23', stars: 4, text: 'Lost a star because the candle lesson was just a picture of a candle.' },
    ],
  },
  {
    slug: 'funded-in-7',
    title: 'Funded in 7 Days',
    subtitle: 'Pass any prop firm evaluation. In replay mode. At 60x speed.',
    category: 'Prop Firms',
    level: 'Intermediate',
    instructor: 'brayden',
    price: 497,
    was: 1997,
    scene: 'jet-stairs',
    rating: 4.7,
    ratings: 212,
    students: '5,100+',
    length: '90 min + eval coupon codes',
    badge: 'Hot',
    upsellTo: 'mastermind',
    outcomes: ['The "one good day" method', 'Trailing drawdown, explained by someone who breached it 9 times', 'How to frame your certificate', 'Coupon codes that expire tonight (every night)'],
    modules: [
      {
        title: 'Module 1 · Passing',
        lessons: [
          L('f1', 'The one good day method', 13, 'Pass on day one, then never trade the account again.'),
          L('f2', 'Trailing drawdown', 17, 'It trails you. Like this course’s retargeting ads.'),
          L('f3', 'Using the speed buttons', 6, 'At 60x a whole session takes 6 minutes. Efficient losing.'),
        ],
      },
      {
        title: 'Module 2 · Funded',
        lessons: [
          L('f4', 'Framing your certificate', 5, 'Matte black frame. Hang it behind you on calls.'),
          L('f5', 'Requesting a payout', 8, 'Request it before you lose it. Timing is everything.'),
          L('f6', 'Getting re-funded after you breach', 20, 'Covered in the Larp Mastermind.', true),
        ],
      },
    ],
    reviews: [
      { name: 'Devon, 31', stars: 5, text: 'Funded six times this year. That’s six times I had to buy it again.' },
      { name: 'Kaitlyn, 24', stars: 5, text: 'Got my first payout certificate! Printed it, framed it, the eval fees were $1,900.' },
    ],
  },
  {
    slug: 'millionaire-mindset',
    title: 'Mindset of a Millionaire',
    subtitle: 'Your strategy is fine. Your energy is the problem.',
    category: 'Mindset',
    level: 'All levels',
    instructor: 'vibes',
    price: 197,
    was: 797,
    scene: 'pool',
    rating: 4.9,
    ratings: 88,
    students: '3,300+',
    length: '45 min of guided breathing',
    outcomes: ['Manifesting green days', 'Journaling your losses into wins', 'Why red days are a test from the universe', 'Cold plunge (bring your own ice)'],
    modules: [
      {
        title: 'Module 1 · Energy',
        lessons: [
          L('d1', 'Abundance breathing', 11, 'Inhale for 4, hold for 4, buy the dip for 4.'),
          L('d2', 'Manifesting green days', 9, 'Say "I am profitable" before the open. Results not guaranteed by the universe.'),
          L('d3', 'Loss reframing', 14, 'A loss is just a win that hasn’t happened yet.'),
        ],
      },
      {
        title: 'Module 2 · Discipline',
        lessons: [
          L('d4', 'Revenge trading is self care', 7, 'It isn’t. This lesson is 7 minutes of Dr. Vibes saying that.'),
          L('d5', 'The 4 AM routine', 10, 'Wake up at 4. Post that you woke up at 4. Go back to sleep.'),
        ],
      },
    ],
    reviews: [
      { name: 'Marcus, 27', stars: 5, text: 'My Lambo is on order. The order is a limit order. It has not filled.' },
      { name: 'Priya, 29', stars: 5, text: 'I still lose, but now I lose calmly.' },
    ],
  },
  {
    slug: 'one-indicator',
    title: 'Scalping NQ with 1 Indicator',
    subtitle: 'The indicator is a moving average. It has my logo on it.',
    category: 'Strategy',
    level: 'Intermediate',
    instructor: 'brayden',
    price: 397,
    was: 1497,
    scene: 'cash-stacks',
    rating: 4.6,
    ratings: 57,
    students: '2,900+',
    length: '1 hr + "proprietary" indicator',
    outcomes: ['Installing the Larp Ribbon™ (a 20 EMA)', 'Buying when price is above it', 'Selling when price is below it', 'Blaming the indicator on red days'],
    modules: [
      {
        title: 'Module 1 · The Larp Ribbon™',
        lessons: [
          L('i1', 'Installing the indicator', 5, 'Settings → Moving Average → 20. That’s the proprietary part.'),
          L('i2', 'Above means buy', 12, 'If price is above the line, buy. Repeat until it isn’t.'),
          L('i3', 'Below means sell', 12, 'This one is the same video, flipped horizontally.'),
          L('i4', 'Ribbon Pro (paid add-on)', 9, 'It’s a 50 EMA.', true),
        ],
      },
    ],
    reviews: [
      { name: 'Tom, 34', stars: 5, text: 'Paid $397 to learn the 20 EMA. Best purchase I can no longer refund.' },
      { name: 'Eli, 21', stars: 4, text: 'Works great on the chart in the thumbnail.' },
    ],
  },
  {
    slug: 'lifestyle-content',
    title: 'Lifestyle Content Masterclass',
    subtitle: 'The real business model: rent the Lambo, film it, sell the course.',
    category: 'Lifestyle',
    level: 'Elite',
    instructor: 'chase',
    price: 697,
    was: 2997,
    scene: 'garage',
    rating: 5.0,
    ratings: 19,
    students: '900+',
    length: '2 hrs, filmed in a rented penthouse',
    badge: 'Honest',
    outcomes: ['Renting a supercar by the hour', 'Angles that hide the rental sticker', 'Writing "I made $13k this month" with no proof', 'Turning students into instructors (and customers)'],
    modules: [
      {
        title: 'Module 1 · Props',
        lessons: [
          L('c1', 'The 1-hour Lambo', 10, 'Book 60 minutes. Spend 55 filming, 5 arguing about the deposit.'),
          L('c2', 'Penthouse by the hour', 8, 'Search "content house rental". Bring your own laptop with charts on it.'),
          L('c3', 'AI photos', 6, 'Or skip renting entirely. Every photo on this site is AI.'),
        ],
      },
      {
        title: 'Module 2 · The funnel',
        lessons: [
          L('c4', 'Countdown timers', 7, 'The timer resets. There are always 3 spots left.'),
          L('c5', 'Pre-checked upsells', 9, 'You’ll see these at checkout. They’re pre-checked.'),
          L('c6', 'Selling the course about selling courses', 15, 'You are here.'),
        ],
      },
    ],
    reviews: [
      { name: 'Chase (instructor)', stars: 5, text: 'This is the only course on the site that does what it says.' },
      { name: 'Ryan, 26', stars: 5, text: 'Launched my own course after this. My students are launching theirs. Nobody trades.' },
    ],
  },
  {
    slug: 'mastermind',
    title: 'Larp Mastermind',
    subtitle: 'Fly to Dubai, sit in a rented penthouse, watch me not trade.',
    category: 'Lifestyle',
    level: 'Elite',
    instructor: 'chase',
    price: 4997,
    was: 14997,
    scene: 'rolls',
    rating: 4.9,
    ratings: 7,
    students: '40',
    length: '3 days in person',
    badge: '3 spots left',
    outcomes: ['Everything in The Larp Model™', 'Group photo with the rented Lambo', 'Weekly 1-on-1 (with my cousin)', 'Funded Guarantee™ (not a guarantee)', 'Your name on the website, briefly'],
    modules: [
      {
        title: 'Day 1 · Arrival',
        lessons: [
          L('x1', 'Airport pickup (in a Corolla)', 30, 'The Lambo is for photos only.'),
          L('x2', 'Group photo', 45, 'Stand behind the car. Don’t touch the car.'),
        ],
      },
      {
        title: 'Day 2 · Trading',
        lessons: [
          L('x3', 'Live trading session', 15, 'Market was choppy, so we went to brunch instead.'),
          L('x4', 'Rooftop networking', 120, 'Everyone here also sells a course.'),
        ],
      },
      {
        title: 'Day 3 · Departure',
        lessons: [L('x5', 'Upsell to Mastermind Platinum', 60, 'It’s the same trip, but in Miami.', true)],
      },
    ],
    reviews: [{ name: 'Anonymous', stars: 5, text: 'The penthouse was nice. I think I saw a chart once.' }],
  },
  {
    slug: 'larp-model-2',
    title: 'The Larp Model™ 2.0',
    subtitle: 'What 1.0 should have been. Presale. Ships "soon".',
    category: 'Strategy',
    level: 'Elite',
    instructor: 'chase',
    price: 1997,
    was: 7997,
    scene: 'corvette',
    rating: 5.0,
    ratings: 0,
    students: 'Presale',
    length: 'TBA (after we hit 500 presales)',
    badge: 'Presale',
    outcomes: ['The secret 6th step', 'A new acronym for the same setup', 'Lifetime access (lifetime of the Discord)', 'Priority access to 3.0'],
    modules: [
      {
        title: 'Coming soon',
        lessons: [
          L('v1', 'Welcome to 2.0', 3, 'Thanks for your presale. Recording starts after the next mastermind.'),
          L('v2', 'Everything from 1.0, renamed', 0, 'Content drops "soon".', true),
        ],
      },
    ],
    reviews: [{ name: 'Nobody yet', stars: 5, text: 'Five stars in advance, as instructed.' }],
  },
  {
    slug: 'free-bootcamp',
    title: 'Free 3-Day Bootcamp',
    subtitle: 'Totally free. Just enter checkout. Ignore the upsells.',
    category: 'Bundles',
    level: 'Beginner',
    instructor: 'chase',
    price: 0,
    was: 497,
    scene: 'cards',
    rating: 4.9,
    ratings: 1204,
    students: '40,000+',
    length: '3 × 20 min webinars (90% pitch)',
    badge: 'Free',
    upsellTo: 'larp-model',
    outcomes: ['Day 1: my story (the couch)', 'Day 2: one chart, briefly', 'Day 3: a 70-minute pitch for The Larp Model™'],
    modules: [
      {
        title: 'Bootcamp',
        lessons: [
          L('b1', 'Day 1 · My story', 20, 'I was broke. Now I’m less broke. You can be too, for $997.'),
          L('b2', 'Day 2 · The chart', 20, 'Here’s one chart. The rest are in the paid course.'),
          L('b3', 'Day 3 · The offer', 70, 'Price drops from $4,997 to $997 if you buy in the next 15 minutes.'),
        ],
      },
    ],
    reviews: [{ name: 'Sam, 25', stars: 5, text: 'It was free, and it only cost me $997.' }],
  },
  {
    slug: 'everything-bundle',
    title: 'The Everything Bundle',
    subtitle: 'Every course, the mastermind and the presale. Best value (we say).',
    category: 'Bundles',
    level: 'All levels',
    instructor: 'chase',
    price: 6997,
    was: 29997,
    scene: 'driveway',
    rating: 4.9,
    ratings: 12,
    students: '61',
    length: 'All of it',
    badge: 'Best value',
    includes: ['larp-model', 'larp-starter', 'funded-in-7', 'millionaire-mindset', 'one-indicator', 'lifestyle-content', 'mastermind', 'larp-model-2'],
    outcomes: ['All 8 courses', 'Save $3,079 vs buying separately', 'A second, bigger Discord role', 'Bragging rights (sim)'],
    modules: [],
    reviews: [{ name: 'Whale, 38', stars: 5, text: 'Bought everything. Haven’t opened anything. Feels great.' }],
  },
];

export const courseBySlug = (slug: string) => COURSES.find((c) => c.slug === slug);

export const allLessons = (c: Course) => c.modules.flatMap((m) => m.lessons);

/** Lessons you can actually "complete" (locked upsell lessons don't count toward progress). */
export const openLessons = (c: Course) => allLessons(c).filter((l) => !l.locked);

export const totalMins = (c: Course) => allLessons(c).reduce((s, l) => s + l.mins, 0);

export const UPSELLS = [
  { id: 'vip', name: 'VIP Discord', note: 'lifetime of the Discord, not yours', price: 297 },
  { id: 'call', name: '1-on-1 call', note: 'with the guru’s cousin', price: 497 },
  { id: 'guarantee', name: 'Funded Guarantee™', note: 'not a guarantee', price: 197 },
];

export const COUPONS: Record<string, { pct: number; note: string }> = {
  LARP: { pct: 0, note: '0% off. Thanks for the energy.' },
  CHASE90: { pct: 90, note: '90% off, applied to the fake price, which was 90% inflated.' },
  FREE: { pct: 100, note: 'Everything is free. It always was. Nothing here costs money.' },
};

export const RED_FLAGS = [
  ['Income claims with no audited statements', 'Screenshots, certificates and "payout proofs" are trivial to fake. This whole site took an afternoon.'],
  ['Lifestyle photos', 'None of the cars, views or yachts on this site belong to anyone in it. Real gurus rent them by the hour.'],
  ['Fake urgency', 'The timer resets. There are always 3 spots left.'],
  ['Inflated "was" prices', 'Nothing was ever $4,997. The strikethrough exists to make $997 feel cheap.'],
  ['Testimonials you can’t verify', 'Jaden, 19, does not exist. Neither do most of them.'],
  ['Prop-firm "funded" certificates as proof', 'Passing an evaluation isn’t income. Most funded accounts never pay out.'],
  ['Pre-checked upsells and locked bonus lessons', 'You paid for a course, and the last lesson is another course.'],
];

export const money = (n: number) => (n === 0 ? 'Free' : `$${n.toLocaleString('en-US')}`);
