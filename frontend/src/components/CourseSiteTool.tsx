import { BookOpen, Check, ExternalLink, GraduationCap, RotateCw, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Label, Panel, Tag } from './ui';

// The Larp Academy course site (course-site/). In dev it's proxied at /course by vite.config.ts.
export const COURSE_URL = (import.meta.env.VITE_COURSE_URL as string | undefined) ?? (import.meta.env.DEV ? '/course/' : 'https://larpmodel.onrender.com');
const site = (hash = '') => `${COURSE_URL.replace(/\/?$/, '/')}${hash}`;

const PAGES = [
  { label: 'Storefront', hash: '' },
  { label: 'All courses', hash: '#/courses' },
  { label: 'The Larp Model™', hash: '#/courses/larp-model' },
  { label: 'Cart', hash: '#/cart' },
  { label: 'My courses', hash: '#/library' },
];

const FEATURES = [
  '10 courses that all teach the same strategy',
  'Countdown timers that reset, 3 spots left forever',
  'Pre-checked upsells and coupon codes (LARP, CHASE90, FREE)',
  'Fake checkout: no card fields, $0.00 actually charged',
  'Student dashboard with a locked "bonus" lesson in every course',
  'Ends with the real red flags of trading-course scams',
];

/** Larp Studio tool: the "sell my course" website, previewed in a fake browser frame. */
export default function CourseSiteTool() {
  const [page, setPage] = useState(PAGES[0].hash);
  const [reload, setReload] = useState(0);
  const url = site(page);

  return (
    <div className="mx-10 mt-6 grid max-w-6xl grid-cols-[300px_minmax(0,1fr)] gap-4">
      <div className="space-y-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <Label>Your course website</Label>
            <Tag tone="green">Live</Tag>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-warn/40 bg-warn/10 text-warn">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="text-[14px] font-semibold">Larp Academy</div>
              <div className="text-[11px] text-mute">by Chase Larpington</div>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-mute">
            Every funded trader eventually stops trading and starts selling a course. We built yours. It’s a full guru storefront, already “selling”.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-warn/50 bg-gradient-to-r from-warn/20 to-warn/5 px-3 py-2.5 text-[12px] font-semibold text-warn hover:from-warn/30"
          >
            Open full site <ExternalLink size={12} />
          </a>
        </Panel>

        <Panel className="p-5">
          <Label>Jump to</Label>
          <div className="mt-2 flex flex-col gap-1">
            {PAGES.map((p) => (
              <button
                key={p.label}
                onClick={() => setPage(p.hash)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] transition ${page === p.hash ? 'border-line2 bg-panel2 text-ink' : 'border-transparent text-mute hover:text-ink'}`}
              >
                {p.hash === '#/cart' ? <ShoppingCart size={13} /> : <BookOpen size={13} />} {p.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <Label>What’s on it</Label>
          <ul className="mt-2 space-y-2 text-[12px] text-mute">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <Check size={13} className="mt-0.5 shrink-0 text-up" /> {f}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="flex min-h-[640px] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-panel2 px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-down/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-up/70" />
          </div>
          <div className="flex-1 truncate rounded-md border border-line bg-bg px-3 py-1 font-mono text-[11px] text-mute">larpacademy.com/{page.replace(/^#\//, '')}</div>
          <button onClick={() => setReload((r) => r + 1)} className="text-dim hover:text-ink" aria-label="Reload">
            <RotateCw size={13} />
          </button>
        </div>
        <iframe key={`${url}-${reload}`} src={url} title="Larp Academy preview" className="w-full flex-1 bg-bg" />
      </Panel>
    </div>
  );
}
