import { useEffect, useRef } from 'react';
import {
  CrosshairMode,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineStyle,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';
import { useMarket } from '../lib/market';
import { Root } from '../lib/instruments';
import { INDICATORS, IndicatorId, Pt, aggregate, bollinger, ema, sma, vwap } from '../lib/indicators';

export interface ChartLine {
  price: number;
  color: string;
  title: string;
  dashed?: boolean;
}

interface Props {
  root: Root;
  label: string;
  tf: number;
  indicators: IndicatorId[];
  lines: ChartLine[];
}

const ts = (t: number) => t as UTCTimestamp;
const toLine = (p: Pt[]) => p.map((x) => ({ time: ts(x.time), value: x.value }));
const color = (id: IndicatorId) => INDICATORS.find((i) => i.id === id)!.color;

export default function CandleChart({ root, label, tf, indicators, lines }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const candles = useRef<ISeriesApi<'Candlestick'>>();
  const priceLines = useRef<IPriceLine[]>([]);

  useEffect(() => {
    const c = createChart(el.current!, {
      autoSize: true,
      layout: { background: { color: '#0b0c0e' }, textColor: '#8a8f99', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
      grid: { vertLines: { color: '#15171b' }, horzLines: { color: '#15171b' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#212329' },
      timeScale: { borderColor: '#212329', timeVisible: true, secondsVisible: false, rightOffset: 8 },
    });
    chart.current = c;
    return () => {
      c.remove();
      chart.current = undefined;
    };
  }, []);

  useEffect(() => {
    const c = chart.current!;
    c.applyOptions({ watermark: { visible: true, text: label, color: 'rgba(255,255,255,0.035)', fontSize: 64, fontFamily: 'Unbounded, sans-serif' } });

    const vol = indicators.includes('volume')
      ? c.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' }, lastValueVisible: false, priceLineVisible: false })
      : undefined;
    if (vol) c.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const cs = c.addCandlestickSeries({
      upColor: '#2fd98a',
      downColor: '#f2545b',
      borderVisible: false,
      wickUpColor: '#2fd98a',
      wickDownColor: '#f2545b',
    });
    candles.current = cs;

    const lineOpts = (id: IndicatorId) => ({ color: color(id), lineWidth: 1 as const, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false });
    const smaS = indicators.includes('sma20') ? c.addLineSeries(lineOpts('sma20')) : undefined;
    const emaS = indicators.includes('ema50') ? c.addLineSeries(lineOpts('ema50')) : undefined;
    const vwapS = indicators.includes('vwap') ? c.addLineSeries({ ...lineOpts('vwap'), lineStyle: LineStyle.Dashed }) : undefined;
    const bbU = indicators.includes('bb') ? c.addLineSeries(lineOpts('bb')) : undefined;
    const bbL = indicators.includes('bb') ? c.addLineSeries(lineOpts('bb')) : undefined;

    const render = (full: boolean) => {
      const data = aggregate(useMarket.getState().roots[root].candles, tf);
      const last = data[data.length - 1];
      const bar = { time: ts(last.time), open: last.open, high: last.high, low: last.low, close: last.close };
      const volBar = (x: typeof last) => ({ time: ts(x.time), value: x.volume, color: x.close >= x.open ? 'rgba(47,217,138,0.25)' : 'rgba(242,84,91,0.25)' });
      const bb = bbU ? bollinger(data.slice(full ? 0 : -25)) : undefined;
      const series: [ISeriesApi<'Line'> | undefined, () => Pt[]][] = [
        [smaS, () => sma(data, 20)],
        [emaS, () => ema(data, 50)],
        [vwapS, () => vwap(data)],
        [bbU, () => bb!.upper],
        [bbL, () => bb!.lower],
      ];
      if (full) {
        cs.setData(data.map((x) => ({ time: ts(x.time), open: x.open, high: x.high, low: x.low, close: x.close })));
        vol?.setData(data.map(volBar));
        series.forEach(([s, f]) => s?.setData(toLine(f())));
      } else {
        cs.update(bar);
        vol?.update(volBar(last));
        series.forEach(([s, f]) => {
          if (!s) return;
          const pts = f();
          const p = pts[pts.length - 1];
          if (p) s.update({ time: ts(p.time), value: p.value });
        });
      }
    };

    render(true);
    const unsub = useMarket.subscribe((s, prev) => {
      if (s.roots[root] !== prev.roots[root]) render(false);
    });

    return () => {
      unsub();
      // the chart itself may already be gone (unmount / StrictMode re-run)
      if (chart.current === c) [cs, vol, smaS, emaS, vwapS, bbU, bbL].forEach((s) => s && c.removeSeries(s));
      candles.current = undefined;
      priceLines.current = [];
    };
  }, [root, tf, label, indicators.join(',')]);

  const linesKey = JSON.stringify(lines);
  useEffect(() => {
    const cs = candles.current;
    if (!cs) return;
    priceLines.current.forEach((l) => cs.removePriceLine(l));
    priceLines.current = lines.map((l) =>
      cs.createPriceLine({ price: l.price, color: l.color, title: l.title, lineWidth: 1, lineStyle: l.dashed ? LineStyle.Dashed : LineStyle.Solid, axisLabelVisible: true }),
    );
  }, [linesKey, root, tf, indicators.join(',')]);

  return <div ref={el} className="absolute inset-0" />;
}
