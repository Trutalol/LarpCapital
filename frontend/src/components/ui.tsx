import { ReactNode } from 'react';

export function Logo({ size = 34, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d2a23" />
            <stop offset="1" stopColor="#0a0f0c" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#lg)" stroke="#2fd98a33" />
        <line x1="11" y1="13" x2="11" y2="31" stroke="#2fd98a" strokeWidth="1.4" />
        <rect x="8.5" y="17" width="5" height="10" rx="1" fill="#2fd98a" />
        <line x1="20" y1="8" x2="20" y2="27" stroke="#2fd98a" strokeWidth="1.4" />
        <rect x="17.5" y="11" width="5" height="12" rx="1" fill="#2fd98a" />
        <line x1="29" y1="5" x2="29" y2="20" stroke="#e7e8eb" strokeWidth="1.4" />
        <rect x="26.5" y="7" width="5" height="9" rx="1" fill="#e7e8eb" />
      </svg>
      {wordmark && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight text-ink">LARP</div>
          <div className="mt-1 font-display text-[9px] tracking-[0.32em] text-mute">CAPITAL</div>
        </div>
      )}
    </div>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'red' | 'green' | 'blue' | 'amber' }) {
  const tones = {
    neutral: 'border-line2 bg-panel2 text-mute',
    red: 'border-down/40 bg-down/10 text-down',
    green: 'border-up/40 bg-up/10 text-up',
    blue: 'border-buy/50 bg-buy/10 text-[#7aa2ff]',
    amber: 'border-warn/40 bg-warn/10 text-warn',
  };
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>{children}</span>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-panel ${className}`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-dim">{children}</div>;
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-dim">{icon}</div>
      <div className="text-base font-semibold text-ink">{title}</div>
      <div className="mt-1 max-w-xs text-xs text-mute">{body}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  tone = 'ghost',
  className = '',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'ghost' | 'green' | 'blue' | 'red' | 'solid';
  className?: string;
  disabled?: boolean;
}) {
  const tones = {
    ghost: 'border-line2 bg-panel2 text-ink hover:bg-[#1c1e23]',
    solid: 'border-ink bg-ink text-bg hover:bg-white',
    green: 'border-up/50 bg-up/10 text-up hover:bg-up/20',
    blue: 'border-buy bg-buy text-white hover:bg-[#3d72ff]',
    red: 'border-down bg-down text-white hover:bg-[#ff6168]',
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition duration-150 enabled:hover:-translate-y-px enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
