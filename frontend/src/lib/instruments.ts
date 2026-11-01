export type Root = 'NQ' | 'ES' | 'CL' | 'GC';
export type Sym = 'NQ' | 'MNQ' | 'ES' | 'MES' | 'CL' | 'MCL' | 'GC' | 'MGC';

export interface Instrument {
  sym: Sym;
  root: Root;
  name: string;
  tick: number;
  pointValue: number;
  commission: number; // per contract, per side
  micro: boolean;
  decimals: number;
}

export const CONTRACT_MONTH = 'Z26';

export const INSTRUMENTS: Record<Sym, Instrument> = {
  NQ: { sym: 'NQ', root: 'NQ', name: 'E-mini Nasdaq-100', tick: 0.25, pointValue: 20, commission: 1.75, micro: false, decimals: 2 },
  MNQ: { sym: 'MNQ', root: 'NQ', name: 'Micro E-mini Nasdaq-100', tick: 0.25, pointValue: 2, commission: 0.5, micro: true, decimals: 2 },
  ES: { sym: 'ES', root: 'ES', name: 'E-mini S&P 500', tick: 0.25, pointValue: 50, commission: 1.75, micro: false, decimals: 2 },
  MES: { sym: 'MES', root: 'ES', name: 'Micro E-mini S&P 500', tick: 0.25, pointValue: 5, commission: 0.5, micro: true, decimals: 2 },
  CL: { sym: 'CL', root: 'CL', name: 'Crude Oil', tick: 0.01, pointValue: 1000, commission: 1.9, micro: false, decimals: 2 },
  MCL: { sym: 'MCL', root: 'CL', name: 'Micro Crude Oil', tick: 0.01, pointValue: 100, commission: 0.6, micro: true, decimals: 2 },
  GC: { sym: 'GC', root: 'GC', name: 'Gold', tick: 0.1, pointValue: 100, commission: 1.9, micro: false, decimals: 1 },
  MGC: { sym: 'MGC', root: 'GC', name: 'Micro Gold', tick: 0.1, pointValue: 10, commission: 0.6, micro: true, decimals: 1 },
};

export const SYMBOLS = Object.keys(INSTRUMENTS) as Sym[];

export const ROOTS: Record<Root, { name: string; start: number; vol: number; tick: number }> = {
  NQ: { name: 'Nasdaq-100', start: 28550, vol: 0.016, tick: 0.25 },
  ES: { name: 'S&P 500', start: 7650, vol: 0.012, tick: 0.25 },
  CL: { name: 'Crude Oil', start: 61.2, vol: 0.025, tick: 0.01 },
  GC: { name: 'Gold', start: 4050, vol: 0.013, tick: 0.1 },
};

/** Size of a position in E-mini equivalents (micros count as 1/10). */
export const miniEquivalent = (sym: Sym, qty: number) => Math.abs(qty) * (INSTRUMENTS[sym].micro ? 0.1 : 1);

export const roundToTick = (price: number, tick: number) => Math.round(price / tick) * tick;
