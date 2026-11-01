import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Award, BarChart3, CandlestickChart, Crown, DollarSign, ExternalLink, LayoutDashboard, PlusSquare, Sparkles, Trophy, User } from 'lucide-react';
import { Logo } from './ui';
import { useApp, xpFor } from '../lib/store';
import EventLayer from './EventLayer';

// The Larp Academy course site (course-site/). In dev it's proxied at /course by vite.config.ts.
const COURSE_URL = (import.meta.env.VITE_COURSE_URL as string | undefined) ?? (import.meta.env.DEV ? '/course/' : 'https://larpmodel.onrender.com');

const NAV = [
  { to: '/accounts', label: 'Account Summary', icon: LayoutDashboard },
  { to: '/trade', label: 'Trade', icon: CandlestickChart },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/payouts', label: 'Payouts', icon: DollarSign },
  { to: '/certificates', label: 'Certificates', icon: Award },
  { to: '/studio', label: 'Larp Studio', icon: Sparkles },
  { to: '/profile', label: 'My Profile', icon: User },
];

export default function Layout() {
  const nav = useNavigate();
  const sessionDate = useApp((s) => s.sessionDate);
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-ink">
      <aside className="flex w-[200px] shrink-0 flex-col border-r border-line bg-[#0b0c0e]">
        <div className="border-b border-line px-5 py-6">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 p-2 pt-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition ${
                  isActive ? 'border-line2 bg-panel2 text-ink' : 'border-transparent text-mute hover:text-ink'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mx-2 my-3 border-t border-line" />
        <button
          onClick={() => nav('/add')}
          className="mx-2 flex items-center gap-2.5 rounded-lg border border-up/50 bg-gradient-to-r from-up/15 to-up/5 px-3 py-2.5 text-[12px] font-semibold text-up hover:from-up/25"
        >
          <PlusSquare size={14} /> Add Account
        </button>
        <a
          href={COURSE_URL}
          target="_blank"
          rel="noreferrer"
          className="mx-2 mt-2 flex items-center gap-2.5 rounded-lg border border-warn/50 bg-gradient-to-r from-warn/15 to-warn/5 px-3 py-2.5 text-[12px] font-semibold text-warn hover:from-warn/25"
        >
          <Crown size={14} /> Buy my course
          <ExternalLink size={11} className="ml-auto opacity-60" />
        </a>
        <div className="mt-auto space-y-2 p-3">
          <div className="rounded-lg border border-line bg-panel p-3">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-dim">
              <BarChart3 size={11} /> Trading session
            </div>
            <div className="mt-1 font-mono text-xs text-ink">{sessionDate}</div>
          </div>
        </div>
      </aside>
      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <EventLayer />
    </div>
  );
}

export function ProfileCard() {
  const name = useApp((s) => s.profile.name);
  const accounts = useApp((s) => s.accounts);
  const payouts = useApp((s) => s.payouts);
  const { level, progress, xp } = xpFor({ accounts, payouts });
  const funded = accounts.filter((a) => a.type === 'funded').length;
  return (
    <div
      className="relative w-[380px] border-2 border-[#2a2c31] bg-gradient-to-br from-[#16171b] to-[#0d0e10] p-4 shadow-[0_0_40px_rgba(47,217,138,0.05)]"
      style={{ clipPath: 'polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px))' }}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line2 bg-bg font-display text-lg text-up">{name.slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="text-[15px] font-bold">{name}</div>
          <div className="font-mono text-[10px] text-mute">{xp.toLocaleString()} XP · {funded} funded</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] font-bold">
        <span>LV{level}</span>
        <div className="h-1 flex-1 rounded-full bg-line2">
          <div className="h-1 rounded-full bg-gradient-to-r from-up/60 to-up" style={{ width: `${Math.max(3, progress * 100)}%` }} />
        </div>
        <span className="text-dim">LV{level + 1}</span>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, big }: { title: string; subtitle?: string; big?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 px-10 pt-8">
      <div className="pt-4">
        {big ? <h1 className="text-3xl font-bold tracking-tight">{title}</h1> : <h1 className="font-display text-sm font-semibold tracking-[0.25em]">{title}</h1>}
        {subtitle && <p className="mt-1.5 text-[13px] text-mute">{subtitle}</p>}
      </div>
      <ProfileCard />
    </div>
  );
}
