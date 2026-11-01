import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { AppEvent, useApp } from '../lib/store';
import { ScaledCert, downloadCert } from './Certificate';
import { Btn } from './ui';

function Toast({ e }: { e: AppEvent }) {
  const dismiss = useApp((s) => s.dismissEvent);
  useEffect(() => {
    const t = setTimeout(() => dismiss(e.id), e.kind === 'error' ? 4500 : 3000);
    return () => clearTimeout(t);
  }, [e.id]);
  const err = e.kind === 'error';
  return (
    <div className={`pointer-events-auto flex w-80 items-start gap-2.5 rounded-lg border bg-panel/95 p-3 shadow-2xl backdrop-blur ${err ? 'border-down/40' : 'border-line2'}`}>
      {err ? <AlertTriangle size={15} className="mt-0.5 shrink-0 text-down" /> : <Info size={15} className="mt-0.5 shrink-0 text-up" />}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold">{e.title}</div>
        {e.body && <div className="mt-0.5 text-[11px] text-mute">{e.body}</div>}
      </div>
      <button onClick={() => dismiss(e.id)} className="text-dim hover:text-ink">
        <X size={13} />
      </button>
    </div>
  );
}

function BigEvent({ e }: { e: AppEvent }) {
  const dismiss = useApp((s) => s.dismissEvent);
  const cert = useApp((s) => s.certificates.find((c) => c.id === e.certId));
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const breach = e.kind === 'breach';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-sm">
      {breach && <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle,rgba(242,84,91,0.25),transparent_65%)]" />}
      {!breach && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(47,217,138,0.2),transparent_65%)]" />}
      <div className={`relative w-full max-w-2xl rounded-2xl border bg-[#0d0e10] p-8 text-center shadow-2xl ${breach ? 'border-down/50' : 'border-up/50'}`}>
        <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full ${breach ? 'bg-down/15 text-down' : 'bg-up/15 text-up'}`}>
          {breach ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
        </div>
        <div className={`font-display text-4xl font-bold tracking-tight ${breach ? 'text-down' : 'text-up'}`}>{e.title}</div>
        <div className="mx-auto mt-3 max-w-md text-sm text-mute">{e.body}</div>
        {breach && <div className="mt-2 font-mono text-[11px] text-dim">ACCOUNT {e.accountId} · ALL POSITIONS LIQUIDATED</div>}
        {cert && (
          <div className="mx-auto mt-6 max-w-lg overflow-hidden rounded-lg border border-line2">
            <ScaledCert ref={ref} cert={cert} />
          </div>
        )}
        <div className="mt-6 flex justify-center gap-2">
          {cert && (
            <Btn tone="green" onClick={() => ref.current && downloadCert(ref.current, cert)}>
              Download certificate
            </Btn>
          )}
          {breach ? (
            <Btn
              tone="ghost"
              onClick={() => {
                dismiss(e.id);
                nav('/accounts');
              }}
            >
              Cope & view accounts
            </Btn>
          ) : (
            e.kind === 'pass' && (
              <Btn
                tone="blue"
                onClick={() => {
                  dismiss(e.id);
                  nav('/trade');
                }}
              >
                Trade funded account
              </Btn>
            )
          )}
          <Btn onClick={() => dismiss(e.id)}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

export default function EventLayer() {
  const events = useApp((s) => s.events);
  const big = events.find((e) => e.kind === 'breach' || e.kind === 'pass' || e.kind === 'payout');
  const toasts = events.filter((e) => e.kind === 'toast' || e.kind === 'error').slice(-4);
  return (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {toasts.map((e) => (
          <Toast key={e.id} e={e} />
        ))}
      </div>
      {big && <BigEvent key={big.id} e={big} />}
    </>
  );
}
