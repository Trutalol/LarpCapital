export type DrawdownType = 'EOD' | 'INTRADAY';

export interface Plan {
  id: string;
  family: 'flex' | 'pro';
  name: string;
  size: number;
  target: number;
  drawdown: number;
  drawdownType: DrawdownType;
  dll: number | null;
  maxMinis: number;
  fee: number; // the "real" price we pretend to charge
  payoutSplit: number;
  minPayout: number;
}

const SIZES = [
  { k: 25, target: 1250, dd: 1000, dll: 500, max: 2, fee: 89 },
  { k: 50, target: 3000, dd: 2000, dll: 1000, max: 4, fee: 149 },
  { k: 100, target: 6000, dd: 3000, dll: 2000, max: 8, fee: 279 },
  { k: 150, target: 9000, dd: 4500, dll: 3000, max: 12, fee: 379 },
];

export const PLANS: Plan[] = [
  ...SIZES.map((s) => ({
    id: `flex-${s.k}k`,
    family: 'flex' as const,
    name: `LarpFlex ${s.k}K`,
    size: s.k * 1000,
    target: s.target,
    drawdown: s.dd,
    drawdownType: 'EOD' as const,
    dll: null,
    maxMinis: s.max,
    fee: s.fee,
    payoutSplit: 0.9,
    minPayout: 250,
  })),
  ...SIZES.map((s) => ({
    id: `pro-${s.k}k`,
    family: 'pro' as const,
    name: `LarpPro ${s.k}K`,
    size: s.k * 1000,
    target: s.target,
    drawdown: s.dd,
    drawdownType: 'INTRADAY' as const,
    dll: s.dll,
    maxMinis: s.max,
    fee: Math.round(s.fee * 0.7),
    payoutSplit: 0.9,
    minPayout: 250,
  })),
];

export const planById = (id: string) => PLANS.find((p) => p.id === id)!;
