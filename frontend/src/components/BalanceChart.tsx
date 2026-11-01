import { useEffect, useRef } from 'react';
import { LineStyle, UTCTimestamp, createChart } from 'lightweight-charts';
import { Account } from '../lib/store';

export default function BalanceChart({ account }: { account: Account }) {
  const el = useRef<HTMLDivElement>(null);
  const key = account.history.length + ':' + account.id;

  useEffect(() => {
    const c = createChart(el.current!, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#5b606a', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 },
      grid: { vertLines: { visible: false }, horzLines: { color: '#17191d' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true },
      handleScroll: false,
      handleScale: false,
    });
    const pts = account.history.map((h, i) => ({ ...h, time: Math.floor(h.t / 1000) + i }));
    const bal = c.addAreaSeries({
      lineColor: '#2fd98a',
      topColor: 'rgba(47,217,138,0.28)',
      bottomColor: 'rgba(47,217,138,0.02)',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });
    bal.setData(pts.map((p) => ({ time: p.time as UTCTimestamp, value: p.balance })));
    const mll = c.addLineSeries({ color: '#f2545b', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: true });
    mll.setData(pts.map((p) => ({ time: p.time as UTCTimestamp, value: p.mll })));
    c.timeScale().fitContent();
    return () => c.remove();
  }, [key]);

  return <div ref={el} className="h-full w-full" />;
}
