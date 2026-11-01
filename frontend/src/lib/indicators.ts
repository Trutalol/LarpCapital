import { Candle } from './market';

export type IndicatorId = 'volume' | 'sma20' | 'ema50' | 'vwap' | 'bb';

export const INDICATORS: { id: IndicatorId; label: string; color: string }[] = [
  { id: 'volume', label: 'Volume', color: '#3b3f48' },
  { id: 'sma20', label: 'SMA 20', color: '#f5b83d' },
  { id: 'ema50', label: 'EMA 50', color: '#b47cff' },
  { id: 'vwap', label: 'VWAP', color: '#29c5f6' },
  { id: 'bb', label: 'Bollinger Bands (20, 2)', color: '#5d6bff' },
];

export interface Pt {
  time: number;
  value: number;
}

export function aggregate(candles: Candle[], tf: number): Candle[] {
  if (tf === 60) return candles;
  const out: Candle[] = [];
  for (const c of candles) {
    const t = Math.floor(c.time / tf) * tf;
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
      last.volume += c.volume;
    } else out.push({ ...c, time: t });
  }
  return out;
}

export function sma(c: Candle[], n: number): Pt[] {
  const out: Pt[] = [];
  let sum = 0;
  for (let i = 0; i < c.length; i++) {
    sum += c[i].close;
    if (i >= n) sum -= c[i - n].close;
    if (i >= n - 1) out.push({ time: c[i].time, value: sum / n });
  }
  return out;
}

export function ema(c: Candle[], n: number): Pt[] {
  const k = 2 / (n + 1);
  const out: Pt[] = [];
  let e = c[0]?.close ?? 0;
  c.forEach((x, i) => {
    e = i === 0 ? x.close : x.close * k + e * (1 - k);
    if (i >= n - 1) out.push({ time: x.time, value: e });
  });
  return out;
}

/** VWAP that resets each 6.5h "session" block. */
export function vwap(c: Candle[]): Pt[] {
  const out: Pt[] = [];
  let pv = 0;
  let v = 0;
  let session = -1;
  for (const x of c) {
    const s = Math.floor(x.time / 23400);
    if (s !== session) {
      session = s;
      pv = 0;
      v = 0;
    }
    const tp = (x.high + x.low + x.close) / 3;
    pv += tp * x.volume;
    v += x.volume;
    out.push({ time: x.time, value: v ? pv / v : tp });
  }
  return out;
}

export function bollinger(c: Candle[], n = 20, k = 2) {
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  for (let i = n - 1; i < c.length; i++) {
    const w = c.slice(i - n + 1, i + 1).map((x) => x.close);
    const m = w.reduce((s, x) => s + x, 0) / n;
    const sd = Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / n);
    upper.push({ time: c[i].time, value: m + k * sd });
    lower.push({ time: c[i].time, value: m - k * sd });
  }
  return { upper, lower };
}
