// Red flag checks for the LarpCapital scanner.
// Pure TypeScript with no imports, so the same file runs inside Render Workflows tasks
// and (as a synced copy, see scripts/sync-checks.mjs) in the browser fallback.

export type CheckId = 'hype' | 'math' | 'fineprint' | 'ai';

export interface Flag {
  id: string;
  label: string;
  why: string;
  quote?: string;
  weight: number;
  check: CheckId;
}

export interface CheckResult {
  check: CheckId;
  title: string;
  status: 'ok' | 'skipped' | 'error';
  flags: Flag[];
  note?: string;
  ms: number;
}

export interface Report {
  score: number;
  verdict: string;
  blurb: string;
  flags: Flag[];
  checks: CheckResult[];
  chars: number;
  scannedAt: string;
}

export interface CheckInput {
  check: CheckId;
  text: string;
}

export interface AiOptions {
  geminiKey?: string;
  model?: string;
}

export const MAX_CHARS = 8000;

export const CHECKS: { id: CheckId; title: string; task: string; blurb: string }[] = [
  { id: 'hype', title: 'Hype & pressure', task: 'hypeCheck', blurb: 'Guarantees, fake urgency, lifestyle bait, DM funnels' },
  { id: 'math', title: 'Money math', task: 'mathCheck', blurb: 'Turns return claims into daily compounding and sanity-checks them' },
  { id: 'fineprint', title: 'Prop firm fine print', task: 'fineprintCheck', blurb: 'Activation fees, payout caps, trailing drawdowns, consistency rules' },
  { id: 'ai', title: 'AI second opinion', task: 'aiCheck', blurb: 'Gemini looks for manipulation the keyword rules miss' },
];

const titleOf = (id: CheckId) => CHECKS.find((c) => c.id === id)!.title;

// ---------- helpers ----------

function snippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  let s = text.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) s = '…' + s;
  if (end < text.length) s = s + '…';
  return s;
}

interface Rule {
  id: string;
  label: string;
  re: RegExp;
  weight: number;
  why: string;
}

function applyRules(text: string, rules: Rule[], check: CheckId): Flag[] {
  const flags: Flag[] = [];
  for (const r of rules) {
    const m = r.re.exec(text);
    if (m) flags.push({ id: r.id, label: r.label, why: r.why, weight: r.weight, check, quote: snippet(text, m.index, m[0].length) });
  }
  return flags;
}

function timed(check: CheckId, fn: () => Omit<CheckResult, 'check' | 'title' | 'ms'>): CheckResult {
  const t0 = Date.now();
  const r = fn();
  return { check, title: titleOf(check), ms: Date.now() - t0, ...r };
}

// ---------- 1. hype & pressure ----------

const HYPE_RULES: Rule[] = [
  {
    id: 'guaranteed',
    label: 'Promises guaranteed or risk-free profit',
    re: /\b(guarantee[ds]?|risk[- ]?free|can'?t lose|zero risk|no risk|100% safe)\b/i,
    weight: 20,
    why: 'Nobody can guarantee trading returns. Regulators like the SEC and CFTC list "guaranteed profits" as a top fraud warning sign.',
  },
  {
    id: 'winrate',
    label: 'Claims a near-perfect win rate',
    re: /\b(9\d|100)\s?%\s?(win|accura|success|hit)/i,
    weight: 15,
    why: 'Real strategies lose often. A 90%+ win rate usually means hidden losses, cherry-picked screenshots, or a sim account.',
  },
  {
    id: 'neverlose',
    label: 'Says they never lose',
    re: /\bnever (had a |have a )?(losing|red|bad) (day|week|month|trade)s?\b|\bnever los(e|ing)\b/i,
    weight: 15,
    why: 'Every trader has losing days. Someone who hides them is also hiding what it really costs to follow them.',
  },
  {
    id: 'urgency',
    label: 'Fake urgency or scarcity',
    re: /\b(only \d+ (spots?|seats?|slots?|places?)|spots? (left|remaining)|last chance|ends (tonight|today|soon|at midnight)|limited time|price (goes|going) up|before (it'?s|its) gone|act now|don'?t miss (out|this)|closing (soon|tonight)|first \d+ (people|traders|students))\b/i,
    weight: 12,
    why: 'Countdown timers and "3 spots left" push you to pay before you think. Real education does not sell out at midnight.',
  },
  {
    id: 'dm',
    label: 'Pulls you into DMs or private chats',
    re: /\b(dm me|send (me )?a dm|message me|link in (my )?bio|comment ["“']?[A-Z]{2,}["”']?|telegram|whatsapp|text me)\b/i,
    weight: 8,
    why: 'Moving you into DMs, Telegram or WhatsApp is where the hard sell (or a "pig butchering" scam) happens, away from public replies.',
  },
  {
    id: 'lifestyle',
    label: 'Sells the lifestyle, not the method',
    re: /\b(lambo|lamborghini|rolex|dubai|yacht|private jet|penthouse|ferrari|g[- ]?wagon|bugatti|mclaren)\b|🏎|🛥|🛩/i,
    weight: 8,
    why: 'Cars, watches and Dubai balconies are often rented, staged or AI-generated (you can make them yourself in Larp Studio).',
  },
  {
    id: 'freedom',
    label: '"Quit your 9-5" freedom pitch',
    re: /\b(quit (your|my) (9[- ]?(to)?[- ]?5|job|day job)|fire your boss|financial freedom|passive income|work from (anywhere|the beach)|retire (early|young|by \d+)|escape the matrix|time freedom)\b/i,
    weight: 8,
    why: 'Most day traders lose money, and studies of retail day traders find only a tiny fraction earn more than minimum wage over time.',
  },
  {
    id: 'secret',
    label: 'Secret or "A+" strategy',
    re: /\b(secret (strategy|system|method|formula|setup|sauce|indicator)|banks don'?t want you|they don'?t want you to know|a\+ (setup|strategy|model|system)|proprietary (system|indicator|algo|strategy)|exact (strategy|system|setup) (i|that))\b/i,
    weight: 10,
    why: 'A strategy that really printed money would not be sold for $997. The product is the course, not the edge.',
  },
  {
    id: 'signals',
    label: 'Copy-my-trades or paid signal room',
    re: /\b(copy my trades|signals? (group|room|channel|service)|vip (group|room|discord|telegram|chat)|trade alerts?|mentorship (group|program)|inner circle)\b/i,
    weight: 8,
    why: 'Signal rooms earn subscription money whether or not the calls work. Ask for a broker-verified track record, not screenshots.',
  },
  {
    id: 'students',
    label: 'Leans on student wins',
    re: /\b(my students|students? (made|are making|just|hit|passed)|success stor(y|ies)|testimonials?|member wins)\b/i,
    weight: 6,
    why: 'Student wins are survivorship bias. You only see the few who got lucky, never the many who paid and lost.',
  },
  {
    id: 'nfa',
    label: '"Not financial advice" on a sales pitch',
    re: /\b(not financial advice|nfa|for entertainment purposes)\b/i,
    weight: 4,
    why: 'Pairing big promises with "not financial advice" is a legal shield for the seller, not protection for you.',
  },
];

const HYPE_EMOJI = /🚀|💰|🔥|💸|📈|🤑|💎|💵|🏆|✅|💯/gu;

export function hypeCheck(text: string): CheckResult {
  return timed('hype', () => {
    const flags = applyRules(text, HYPE_RULES, 'hype');
    const emojis = text.match(HYPE_EMOJI)?.length ?? 0;
    if (emojis >= 5) {
      flags.push({ id: 'emoji', label: `Emoji overload (${emojis} money emojis)`, why: 'Rockets and money bags are engagement bait. They make a post feel exciting without saying anything checkable.', weight: 5, check: 'hype' });
    }
    const words = text.split(/\s+/).filter((w) => /[A-Za-z]{4,}/.test(w));
    const caps = words.filter((w) => /^[^a-z]*[A-Z]{4,}[^a-z]*$/.test(w)).length;
    if (words.length >= 12 && caps / words.length > 0.2) {
      flags.push({ id: 'caps', label: 'SHOUTING IN ALL CAPS', why: 'All-caps hype is designed to rush you past the details.', weight: 4, check: 'hype' });
    }
    return { status: 'ok', flags, note: flags.length ? undefined : 'No hype or pressure tactics found.' };
  });
}

// ---------- 2. money math ----------

const WORD_NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
const TRADING_DAYS: Record<string, number> = { day: 1, week: 5, month: 21, year: 252 };
const PERIODS_PER_YEAR: Record<string, number> = { day: 252, week: 52, month: 12, year: 1 };

function parseMoney(n: string, suffix?: string): number {
  const v = parseFloat(n.replace(/,/g, ''));
  const s = (suffix ?? '').toLowerCase();
  return s === 'k' ? v * 1e3 : s === 'm' ? v * 1e6 : v;
}

const usd = (v: number) =>
  v >= 1e12 ? `$${(v / 1e12).toFixed(1)} trillion` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)} billion` : v >= 1e6 ? `$${(v / 1e6).toFixed(1)} million` : `$${Math.round(v).toLocaleString('en-US')}`;
const pct = (v: number) => (v >= 10 ? `${Math.round(v * 100).toLocaleString('en-US')}%` : `${(v * 100).toFixed(1)}%`);

function oneYearOf(start: number, perDay: number): string {
  const log = Math.log10(start) + 252 * Math.log10(1 + perDay);
  if (log > 14) return `more than all the money in the world (about $100 trillion)`;
  return usd(Math.pow(10, log));
}

export function mathCheck(text: string): CheckResult {
  return timed('math', () => {
    const flags: Flag[] = [];
    const seen = new Set<string>();

    // "$500 to $50k in 30 days", "turned $1k into $25,000 in 2 weeks", "$200 → $10K in a month"
    const growth = /\$\s?([\d][\d,]*(?:\.\d+)?)\s?([kKmM])?\s*(?:to|→|->|=>|into|➡️?)\s*\$\s?([\d][\d,]*(?:\.\d+)?)\s?([kKmM])?\b[^.\n]{0,20}?\b(?:in|within|over|after)\s+(\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s*(day|week|month|year)s?/gi;
    for (const m of text.matchAll(growth)) {
      const from = parseMoney(m[1], m[2]);
      const to = parseMoney(m[3], m[4]);
      const n = /^\d+$/.test(m[5]) ? parseInt(m[5], 10) : WORD_NUM[m[5].toLowerCase()] ?? 1;
      const unit = m[6].toLowerCase();
      const days = Math.max(1, n * TRADING_DAYS[unit]);
      if (!(from > 0) || !(to > from)) continue;
      const mult = to / from;
      const perDay = Math.pow(mult, 1 / days) - 1;
      const yearly = Math.pow(1 + perDay, 252) - 1;
      if (yearly < 0.5) continue;
      const key = `g${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      flags.push({
        id: `growth-${flags.length}`,
        check: 'math',
        label: `${usd(from)} → ${usd(to)} is ${mult >= 10 ? Math.round(mult) : mult.toFixed(1)}x in ${n} ${unit}${n === 1 ? '' : 's'}`,
        why: `That is ${pct(perDay)} compounded every single trading day. Keep it up for a year and ${usd(from)} turns into ${oneYearOf(from, perDay)}. The S&P 500 averages about 10% a year.`,
        quote: snippet(text, m.index ?? 0, m[0].length),
        weight: yearly > 10 ? 25 : 15,
      });
    }

    // "3% a day", "20% per week", "50%/month"
    const rate = /(\d+(?:\.\d+)?)\s?%\s?(?:a|an|per|every|each|\/|in a)\s?(day|week|month)\b/gi;
    for (const m of text.matchAll(rate)) {
      const r = parseFloat(m[1]) / 100;
      const unit = m[2].toLowerCase();
      if (!(r > 0)) continue;
      const yearly = Math.pow(1 + r, PERIODS_PER_YEAR[unit]) - 1;
      if (yearly < 0.5) continue;
      const perDay = Math.pow(1 + yearly, 1 / 252) - 1;
      flags.push({
        id: `rate-${flags.length}`,
        check: 'math',
        label: `${m[1]}% per ${unit} works out to ${pct(yearly)} a year`,
        why: `Compounded, that turns $1,000 into ${oneYearOf(1000, perDay)} in one year. Warren Buffett has averaged about 20% a year.`,
        quote: snippet(text, m.index ?? 0, m[0].length),
        weight: yearly > 3 ? 20 : 12,
      });
    }

    // "I made $3,000 a day", "pulling $10k/week"
    const income = /\b(make|made|making|earn|earned|earning|pull|pulled|pulling|profit|profited|bank|banked|banking|clear|cleared|clearing)\w*\b[^.\n]{0,25}?\$\s?([\d][\d,]*(?:\.\d+)?)\s?([kK])?\s?(?:\/|a|per|every|each)\s?(day|week|month)\b/gi;
    for (const m of text.matchAll(income)) {
      const amt = parseMoney(m[2], m[3]);
      const unit = m[4].toLowerCase();
      const yearly = amt * PERIODS_PER_YEAR[unit];
      if (yearly < 50_000) continue;
      flags.push({
        id: `income-${flags.length}`,
        check: 'math',
        label: `Income claim: ${usd(amt)} per ${unit} (${usd(yearly)} a year)`,
        why: 'An income number without the account size, the losing days and a verified statement tells you nothing. Ask for a broker statement, not a screenshot.',
        quote: snippet(text, m.index ?? 0, m[0].length),
        weight: 8,
      });
    }

    return { status: 'ok', flags, note: flags.length ? undefined : 'No return or income claims found to check.' };
  });
}

// ---------- 3. prop firm fine print ----------

const FINEPRINT_RULES: Rule[] = [
  {
    id: 'activation',
    label: 'Activation fee after you "pass"',
    re: /\bactivation (fee|cost|charge)?\b/i,
    weight: 12,
    why: 'An activation fee means you pay again to start the account that was supposed to be your reward for passing.',
  },
  {
    id: 'reset',
    label: 'Paid resets',
    re: /\b(reset fee|resets? (for|at|only) \$|\$\s?\d+\s?resets?|free resets?|unlimited resets?)\b/i,
    weight: 6,
    why: 'Most traders fail evaluations, and reset fees are a big part of how prop firms make money from that.',
  },
  {
    id: 'subscription',
    label: 'Monthly billing on the evaluation',
    re: /(\/\s?mo(nth)?\b|\bper month\b|\ba month\b|\bmonthly (fee|subscription|price|billing)\b|\brecurring\b|\bbilled monthly\b)/i,
    weight: 8,
    why: 'Monthly evaluation billing means the firm earns more the longer you take to pass, or the longer you forget to cancel.',
  },
  {
    id: 'discount',
    label: 'Permanent "huge discount" codes',
    re: /\b([5-9]\d)\s?% off\b|\bpromo code\b|\bcoupon\b|\bdiscount code\b|\buse (my )?code\b|\bcode [A-Z0-9]{3,}\b/i,
    weight: 6,
    why: 'When there is always an 80% off code, the list price is fiction. The influencer posting the code usually earns a cut of every evaluation, pass or fail.',
  },
  {
    id: 'upto',
    label: '"Up to" headline funding',
    re: /\bup to \$\s?[\d,.]+\s?[kKmM]?\b/i,
    weight: 6,
    why: '"Up to" is doing the heavy lifting. The headline number is the maximum after scaling across many accounts, not what you start with.',
  },
  {
    id: 'consistency',
    label: 'Consistency rule',
    re: /\b(consistency (rule|requirement|score)|no single (trading )?day|best day (rule|can'?t|cannot|must))\b/i,
    weight: 10,
    why: 'A consistency rule can void a payout if your best day is too big a share of your profit. Find the exact percentage before you buy.',
  },
  {
    id: 'trailing',
    label: 'Trailing drawdown',
    re: /\b(trailing (drawdown|max|threshold|loss limit)|intraday trailing|eod trailing|end[- ]of[- ]day trailing)\b/i,
    weight: 8,
    why: 'A trailing drawdown follows your open profit up and never comes back down, so a winner that reverses can breach the account.',
  },
  {
    id: 'payoutcap',
    label: 'Payout caps, buffers or waiting periods',
    re: /\b(payout caps?|max(imum)? payouts?|capped (at|payouts?)|withdrawal limit|first payout (after|in|once)|payout buffer|safety net|buffer (of|requirement)|payout (every|after) \d+)\b/i,
    weight: 10,
    why: 'Caps and buffers mean you can "make" $20k on paper and only withdraw a fraction of it.',
  },
  {
    id: 'sim',
    label: '"Funded" account is simulated',
    re: /\b(sim(ulated)?[- ]funded|simulated (account|capital|environment|trading)|demo account|sim account|virtual (capital|funds))\b/i,
    weight: 8,
    why: 'Most "funded" accounts are simulated. Payouts often come out of other traders\' evaluation fees, not from trading real capital.',
  },
  {
    id: 'split',
    label: 'Flashy profit split',
    re: /\b(9\d|100)\s?%\s?(profit )?split\b|\bkeep (up to )?(9\d|100)\s?%/i,
    weight: 4,
    why: 'A 90% split sounds generous, but it only applies to what is left after caps, buffers and fees.',
  },
  {
    id: 'restrictions',
    label: 'Vague prohibited-strategy rules',
    re: /\b(no (news|weekend|overnight) (trading|holding|positions)|news trading (is )?(not allowed|prohibited|restricted)|prohibited (strategies|trading|practices)|we reserve the right)\b/i,
    weight: 6,
    why: 'Loose "prohibited strategy" or "reserve the right" clauses give the firm a reason to deny a payout after the fact.',
  },
  {
    id: 'mindays',
    label: 'Minimum trading days',
    re: /\b(minimum (of )?\d* ?(trading )?days|min(\.)? \d+ (trading )?days|\d+ minimum (trading )?days)\b/i,
    weight: 4,
    why: 'Minimum day rules keep you paying the monthly fee longer, even if you hit the target on day one.',
  },
];

export function fineprintCheck(text: string): CheckResult {
  return timed('fineprint', () => {
    const flags = applyRules(text, FINEPRINT_RULES, 'fineprint');
    return { status: 'ok', flags, note: flags.length ? undefined : 'No prop firm fine print found.' };
  });
}

// ---------- 4. AI second opinion (Gemini) ----------

const AI_PROMPT = `You are a consumer-protection analyst who spots scams in trading "guru" posts, trading courses, signal groups and prop firm offers.
Read the post below and list the manipulation or scam tactics it uses. Focus on things a keyword filter would miss: misleading framing, unverifiable claims, emotional manipulation, conflicts of interest, hidden costs, and anything that suggests a pump, a Ponzi, or a pig-butchering scam.
Return JSON only, in this shape: {"flags":[{"label":"short title, max 8 words","why":"one or two plain sentences for a beginner","quote":"exact short phrase from the post","severity":1|2|3}]}
Return at most 4 flags. If the post looks honest, return {"flags":[]}.

POST:
"""
`;

export async function aiCheck(text: string, opts: AiOptions = {}): Promise<CheckResult> {
  const t0 = Date.now();
  const base = { check: 'ai' as const, title: titleOf('ai') };
  if (!opts.geminiKey) {
    return { ...base, status: 'skipped', flags: [], note: 'No Gemini key configured, so the AI pass was skipped.', ms: 0 };
  }
  const model = opts.model || 'gemini-2.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.geminiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: AI_PROMPT + text.slice(0, MAX_CHARS) + '\n"""' }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Gemini returned ${res.status}`);
  const raw: string = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  let parsed: any;
  try {
    parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, '').trim());
  } catch {
    throw new Error('Gemini did not return valid JSON');
  }
  const list: any[] = Array.isArray(parsed?.flags) ? parsed.flags.slice(0, 4) : [];
  const flags: Flag[] = list
    .filter((f) => f && typeof f.label === 'string')
    .map((f, i) => ({
      id: `ai-${i}`,
      check: 'ai' as const,
      label: String(f.label).slice(0, 80),
      why: String(f.why ?? '').slice(0, 300),
      quote: f.quote ? String(f.quote).slice(0, 160) : undefined,
      weight: [5, 5, 10, 15][Math.min(3, Math.max(1, Number(f.severity) || 1))],
    }));
  return { ...base, status: 'ok', flags, note: flags.length ? `Reviewed by ${model}.` : `${model} found nothing beyond the rules.`, ms: Date.now() - t0 };
}

// ---------- runner + report ----------

export async function runCheck(input: CheckInput, ai: AiOptions = {}): Promise<CheckResult> {
  const text = String(input?.text ?? '').slice(0, MAX_CHARS);
  switch (input?.check) {
    case 'hype':
      return hypeCheck(text);
    case 'math':
      return mathCheck(text);
    case 'fineprint':
      return fineprintCheck(text);
    case 'ai':
      try {
        return await aiCheck(text, ai);
      } catch (e) {
        // The AI pass is a bonus: report the problem but never fail the scan over it.
        return { check: 'ai', title: titleOf('ai'), status: 'error', flags: [], note: `AI pass failed: ${(e as Error).message}`.slice(0, 240), ms: 0 };
      }
    default:
      throw new Error(`Unknown check: ${String(input?.check)}`);
  }
}

const VERDICTS: [number, string, string][] = [
  [12, 'Looks clean', 'No obvious red flags. Still ask who is selling, how they get paid, and for a verified track record.'],
  [35, 'Mild larp', 'A few classic sales tactics. Slow down and verify every number before you pay for anything.'],
  [60, 'Certified larp', 'This reads like a sales funnel, not trading advice. The money is in selling to you.'],
  [80, 'Full guru', 'Textbook guru playbook. Assume the lifestyle is rented and the results are cherry-picked.'],
  [101, 'Run.', 'Nearly every red flag in the book. If real money is involved, walk away and report it.'],
];

export function buildReport(text: string, checks: CheckResult[]): Report {
  const seen = new Set<string>();
  const flags = checks
    .flatMap((c) => c.flags)
    .filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)))
    .sort((a, b) => b.weight - a.weight);
  const total = flags.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(100 * (1 - Math.exp(-total / 60)));
  const [, verdict, blurb] = VERDICTS.find(([max]) => score < max)!;
  return { score, verdict, blurb, flags, checks, chars: text.length, scannedAt: new Date().toISOString() };
}

export const SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: 'guru',
    label: 'Guru post',
    text: `🚀🚀 I turned $500 into $50k in 30 days with my A+ setup 💰💰🔥

No luck. No gambling. Just the SECRET STRATEGY the banks don't want you to know. 94% win rate, I literally never have a red week.

My students are making $2,000 a day from their phones while they quit their 9-5 🏎️ Dubai next month with the whole team.

Only 7 spots left in my VIP Discord before the price goes up at midnight. Comment "LARP" or DM me "A+" and I'll send you the link 📈

Not financial advice. Results guaranteed if you follow the system.`,
  },
  {
    id: 'propfirm',
    label: 'Prop firm offer',
    text: `GET FUNDED UP TO $400K 🏆

Pass one simple evaluation and trade our capital. Keep up to 90% profit split!

LarpFlex 50K: $165/month. Use code CHASE90 for 90% off your first month.
• Trailing drawdown $2,500 (intraday trailing)
• Consistency rule: no single day may exceed 30% of total profit
• Minimum 5 trading days
• One-time activation fee of $149 after you pass
• First payout after 8 winning days, payout cap of $2,000 for the first 3 payouts
• Accounts are simulated funded accounts. We reserve the right to deny payouts for prohibited strategies.

Resets for $99. Limited time offer, ends tonight!`,
  },
  {
    id: 'honest',
    label: 'Honest post',
    text: `Quick journal from this week: I took 9 trades on MES, 4 winners and 5 losers. Net +$212 after commissions on a $10,000 cash account, mostly from one trend day on Wednesday.

I broke my own rule on Friday and sized up after a loss, which cost me about $150. Next week the plan is the same: max 2 contracts, stop trading after two losses in a day.

Most people who day trade lose money, so I treat this as a hobby budget I can afford to lose.`,
  },
];
