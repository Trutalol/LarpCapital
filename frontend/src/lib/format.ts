import { INSTRUMENTS, Sym } from './instruments';

export function money(n: number, opts: { sign?: boolean; cents?: boolean } = {}) {
  const digits = opts.cents ? 2 : 0;
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const neg = n < 0 && Math.abs(n) >= (opts.cents ? 0.005 : 0.5);
  if (neg) return `-$${s}`;
  return `${opts.sign && n > 0 ? '+' : ''}$${s}`;
}

export const price = (n: number, sym: Sym) =>
  n.toLocaleString('en-US', { minimumFractionDigits: INSTRUMENTS[sym].decimals, maximumFractionDigits: INSTRUMENTS[sym].decimals });

export const pnlClass = (n: number) => (n > 0.004 ? 'text-up' : n < -0.004 ? 'text-down' : 'text-ink');

export function duration(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)} min ${s % 60} sec`;
}

export const shortDate = (s: string) => {
  const [y, m, d] = s.split('-');
  return `${m}/${d}/${y}`;
};
