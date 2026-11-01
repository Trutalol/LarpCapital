import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Award, Download, X } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { ScaledCert, downloadCert } from '../components/Certificate';
import { Btn, Empty, Tag } from '../components/ui';
import { Certificate, useApp } from '../lib/store';

function Viewer({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/85 p-8 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-line2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <ScaledCert ref={ref} cert={cert} />
      </div>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Btn
          tone="green"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadCert(ref.current!, cert);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={13} /> {busy ? 'Rendering…' : 'Download PNG'}
        </Btn>
        <Btn onClick={onClose}>
          <X size={13} /> Close
        </Btn>
      </div>
    </div>
  );
}

export default function Certificates() {
  const certs = useApp((s) => s.certificates);
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [filter, setFilter] = useState<'all' | 'funded' | 'payout'>('all');
  const openId = params.get('c');
  const open = certs.find((c) => c.id === openId);
  const shown = certs.filter((c) => filter === 'all' || c.kind === filter);

  return (
    <div className="pb-16">
      <PageHeader title="CERTIFICATES" subtitle="Your funded trader and payout certificates." />
      <div className="mx-10 mt-8 rounded-2xl border border-line bg-[#0d0e10] p-4">
        <div className="inline-flex rounded-xl border border-line bg-panel p-1">
          {(['all', 'funded', 'payout'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-1.5 text-[12px] font-semibold capitalize ${filter === f ? 'bg-panel2 text-ink ring-1 ring-line2' : 'text-mute'}`}>
              {f}
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <Empty
            icon={<Award size={34} strokeWidth={1.3} />}
            title="No certificates yet"
            body="Pass an evaluation to earn a Funded Trader certificate. Request a payout to earn a Payout certificate."
            action={<Btn onClick={() => nav('/add')}>Start an evaluation</Btn>}
          />
        ) : (
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
            {shown.map((c) => (
              <button key={c.id} onClick={() => setParams({ c: c.id })} className="group overflow-hidden rounded-xl border border-line bg-panel text-left transition hover:border-up/50">
                <div className="pointer-events-none">
                  <ScaledCert cert={c} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-[13px] font-semibold">{c.kind === 'payout' ? `$${c.amount!.toLocaleString()} payout` : `${c.title} funded`}</div>
                    <div className="font-mono text-[10px] text-dim">{new Date(c.date).toLocaleDateString()} · {c.accountId}</div>
                  </div>
                  <Tag tone={c.kind === 'payout' ? 'green' : 'blue'}>{c.kind}</Tag>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {open && <Viewer cert={open} onClose={() => setParams({})} />}
    </div>
  );
}
