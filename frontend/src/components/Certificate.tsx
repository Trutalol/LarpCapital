import { forwardRef, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Certificate as Cert } from '../lib/store';
import { Logo } from './ui';

export const CERT_W = 1200;
export const CERT_H = 848;

const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/** Full-resolution certificate. Render inside <ScaledCert> for previews. */
export const CertificateArt = forwardRef<HTMLDivElement, { cert: Cert }>(({ cert }, ref) => {
  const payout = cert.kind === 'payout';
  return (
    <div
      ref={ref}
      style={{ width: CERT_W, height: CERT_H }}
      className="relative overflow-hidden bg-[#0a0b0d] font-sans text-ink"
    >
      {/* texture + glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.05),transparent_55%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:4px_4px]" />
      <svg className="absolute bottom-0 right-0" width="640" height="420" viewBox="0 0 640 420">
        <defs>
          <linearGradient id="cg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2fd98a" stopOpacity="0" />
            <stop offset="1" stopColor="#2fd98a" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2fd98a" stopOpacity="0.18" />
            <stop offset="1" stopColor="#2fd98a" stopOpacity="0" />
          </linearGradient>
          <filter id="blur"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        {[...Array(14)].map((_, i) => {
          const x = 70 + i * 40;
          const h = 30 + i * 14 + (i % 3) * 18;
          const y = 400 - h - i * 12;
          return <rect key={i} x={x} y={y} width="16" height={h} rx="2" fill="#2fd98a" opacity={0.04 + i * 0.012} />;
        })}
        <path d="M0 400 C 160 380, 260 330, 360 250 S 540 90, 640 40 L640 420 L0 420Z" fill="url(#cf)" />
        <path d="M0 400 C 160 380, 260 330, 360 250 S 540 90, 640 40" fill="none" stroke="url(#cg)" strokeWidth="10" filter="url(#blur)" />
        <path d="M0 400 C 160 380, 260 330, 360 250 S 540 90, 640 40" fill="none" stroke="url(#cg)" strokeWidth="2.5" />
      </svg>

      <div className="absolute inset-[26px] border border-up/60" />

      <div className="relative flex h-full flex-col px-[72px] py-[60px]">
        <div className="flex items-start justify-between">
          <Logo size={58} />
          <div className="text-right">
            {payout ? (
              <div className="font-mono text-[13px] font-bold tracking-widest text-mute">ACCOUNT TYPE · FUNDED</div>
            ) : (
              <div className="font-display text-[22px] font-semibold tracking-wider text-mute">{new Date(cert.date).toISOString().slice(0, 10)}</div>
            )}
            <div className="mt-1 font-mono text-[11px] text-dim">CERT #{cert.id.toUpperCase()} · {cert.accountId}</div>
          </div>
        </div>

        <div className="mt-[54px] text-center">
          <div className="bg-gradient-to-b from-white to-[#9aa0aa] bg-clip-text font-display text-[58px] font-bold leading-none tracking-tight text-transparent">
            {payout ? 'PAYOUT CERTIFICATE' : 'FUNDED TRADER'}
          </div>
          <div className="mt-5 flex items-center justify-center gap-5">
            <div className="h-px w-[220px] bg-gradient-to-r from-transparent to-up" />
            <div className="font-display text-[20px] tracking-[0.12em] text-[#c9ccd3]">{payout ? 'PROUDLY AWARDED TO' : 'EVALUATION COMPLETED BY'}</div>
            <div className="h-px w-[220px] bg-gradient-to-l from-transparent to-up" />
          </div>
          <div className="mt-8 font-display text-[64px] font-bold uppercase leading-none text-[#dfe3ff]">{cert.name}</div>
          <div className="mx-auto mt-8 h-px w-[640px] bg-gradient-to-r from-transparent via-up/80 to-transparent" />
        </div>

        <div className="mt-10 text-center">
          <div className="font-display text-[20px] tracking-[0.08em] text-[#c9ccd3]">{payout ? 'PAYOUT AMOUNT' : 'ACCOUNT TYPE'}</div>
          {payout ? (
            <div className="mt-3 font-display text-[78px] font-bold leading-none text-up [text-shadow:0_0_40px_rgba(47,217,138,0.35)]">
              ${cert.amount!.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          ) : (
            <div className="mt-3 font-display text-[54px] font-bold leading-none text-[#e3e6ee]">{cert.title}</div>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="text-left">
            {payout && <div className="font-display text-[20px] font-semibold italic text-mute">{fmtDate(cert.date)}</div>}
            <div className="mt-1 font-display text-[17px] tracking-wider text-mute">LARPCAPITAL</div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-dim">SIMULATED PAPER TRADING · NO REAL FUNDS</div>
          </div>
          <div className="relative text-right">
            <div className="font-script text-[56px] leading-none text-[#e6e8ee]">Larp Capital</div>
            <div className="mt-1 font-display text-[16px] font-semibold tracking-wider text-[#c9ccd3]">CHIEF RISK OFFICER</div>
          </div>
        </div>
      </div>
    </div>
  );
});

/** Scales the full-size certificate to fit its container width. */
export const ScaledCert = forwardRef<HTMLDivElement, { cert: Cert }>(({ cert }, ref) => {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / CERT_W));
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ height: CERT_H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CERT_W }}>
        <CertificateArt ref={ref} cert={cert} />
      </div>
    </div>
  );
});

export async function downloadCert(node: HTMLElement, cert: Cert) {
  await document.fonts.ready;
  const url = await toPng(node, { width: CERT_W, height: CERT_H, pixelRatio: 2, cacheBust: true });
  const a = document.createElement('a');
  a.href = url;
  a.download = `larpcapital-${cert.kind}-${cert.name.replace(/\s+/g, '-').toLowerCase()}-${cert.id}.png`;
  a.click();
}
