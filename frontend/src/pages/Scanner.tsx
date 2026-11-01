import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Calculator, CheckCircle2, Cloud, FileWarning, Laptop, Loader2, Megaphone, MinusCircle, ScanSearch, ShieldAlert, XCircle } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Btn, Label, Panel, Tag } from '../components/ui';
import { CHECKS, MAX_CHARS, SAMPLES, buildReport, runCheck, type CheckId, type CheckResult, type Flag, type Report } from '../lib/redflags';

// Base URL of the scan-api service (Render web service that starts the Render Workflows run).
// Without it, the scanner runs the same checks in the browser.
const API = ((import.meta.env.VITE_SCANNER_API_URL as string | undefined) ?? '').replace(/\/+$/, '');
const GEMINI_KEY_STORAGE = 'larp.geminiKey';

type Status = 'pending' | 'running' | 'succeeded' | 'failed' | 'canceled';
interface CheckState {
  status: Status;
  runId?: string;
  startedAt?: string;
  completedAt?: string;
  retries?: number;
  result?: CheckResult;
  error?: string;
}
type Mode = 'workflows' | 'browser';
interface Run {
  mode: Mode;
  id?: string;
  status: Status;
  startedAt: number;
  checks: Record<CheckId, CheckState>;
  report?: Report;
  error?: string;
  notice?: string;
}

const ICONS: Record<CheckId, typeof Megaphone> = { hype: Megaphone, math: Calculator, fineprint: FileWarning, ai: Bot };
const freshChecks = (): Record<CheckId, CheckState> => ({ hype: { status: 'pending' }, math: { status: 'pending' }, fineprint: { status: 'pending' }, ai: { status: 'pending' } });
const done = (s: Status) => s === 'succeeded' || s === 'failed' || s === 'canceled';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function savedGeminiKey(): string | undefined {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || undefined;
  } catch {
    return undefined;
  }
}

export default function Scanner() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [run, setRun] = useState<Run | null>(null);
  const [api, setApi] = useState<'off' | 'waking' | 'ready' | 'down'>(API ? 'waking' : 'off');
  const cancelled = useRef(false);

  // Free Render web services sleep when idle, so wake the scan API as soon as the page opens.
  useEffect(() => {
    cancelled.current = false;
    if (!API) return;
    let live = true;
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((j) => live && setApi(j?.configured ? 'ready' : 'down'))
      .catch(() => live && setApi('down'));
    return () => {
      live = false;
      cancelled.current = true;
    };
  }, []);

  const busy = !!run && !done(run.status);

  async function scanInBrowser(body: string, notice?: string) {
    const startedAt = Date.now();
    const checks = freshChecks();
    setRun({ mode: 'browser', status: 'running', startedAt, checks: { ...checks }, notice });
    const results = await Promise.all(
      CHECKS.map(async (c, i) => {
        await sleep(120 + i * 140); // stagger so the pipeline reads; the checks themselves are instant
        const t0 = new Date().toISOString();
        setRun((r) => r && { ...r, checks: { ...r.checks, [c.id]: { status: 'running', startedAt: t0 } } });
        const result = await runCheck({ check: c.id, text: body }, { geminiKey: savedGeminiKey() });
        if (c.id !== 'ai') await sleep(250 + i * 180);
        setRun((r) => r && { ...r, checks: { ...r.checks, [c.id]: { status: 'succeeded', startedAt: t0, completedAt: new Date().toISOString(), result } } });
        return result;
      }),
    );
    const report = buildReport(body, results);
    setRun((r) => r && { ...r, status: 'succeeded', report });
  }

  async function scanOnRender(body: string) {
    const startedAt = Date.now();
    setRun({ mode: 'workflows', status: 'pending', startedAt, checks: freshChecks() });
    let id: string;
    try {
      const res = await fetch(`${API}/api/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body }) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 429 || res.status === 400) throw Object.assign(new Error(json.error ?? `Scan API returned ${res.status}`), { final: true });
      if (!res.ok || !json.id) throw new Error(json.error ?? `Scan API returned ${res.status}`);
      id = json.id;
    } catch (e) {
      const err = e as Error & { final?: boolean };
      if (err.final) return setRun((r) => r && { ...r, status: 'failed', error: err.message });
      setApi('down');
      return scanInBrowser(body, `Couldn't reach the Render Workflows API (${err.message}), so this scan ran in your browser.`);
    }
    setRun((r) => r && { ...r, id, status: 'running' });

    // Poll the run: the API reports the root scanPost run plus each check's child run.
    const deadline = Date.now() + 4 * 60_000;
    let misses = 0;
    while (!cancelled.current && Date.now() < deadline) {
      await sleep(1200);
      try {
        const res = await fetch(`${API}/api/scan/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Scan API returned ${res.status}`);
        misses = 0;
        setRun((r) => r && { ...r, status: json.status, checks: { ...freshChecks(), ...json.checks }, report: json.report, error: json.error });
        if (done(json.status)) return;
      } catch (e) {
        if (++misses >= 4) return setRun((r) => r && { ...r, status: 'failed', error: (e as Error).message });
      }
    }
    if (!cancelled.current) setRun((r) => r && { ...r, status: 'failed', error: 'The scan took too long. Try again.' });
  }

  function scan() {
    const body = text.trim().slice(0, MAX_CHARS);
    if (body.length < 10 || busy) return;
    if (API && api !== 'down') void scanOnRender(body);
    else void scanInBrowser(body);
  }

  const willUse: Mode = API && api !== 'down' ? 'workflows' : 'browser';

  return (
    <div className="pb-16">
      <PageHeader title="RED FLAG SCANNER" subtitle="Paste a guru post, course ad or prop firm offer. Four checks run in parallel and score how much larp it contains." />

      <div className="mx-10 mt-8 grid max-w-6xl grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
        {/* input */}
        <Panel className="flex flex-col p-5">
          <div className="flex items-center justify-between">
            <Label>Paste a post</Label>
            <div className="flex gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setText(s.text)}
                  disabled={busy}
                  className="rounded-md border border-line2 bg-panel2 px-2 py-1 font-mono text-[10px] text-mute transition hover:text-ink disabled:opacity-40"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_CHARS}
            rows={14}
            placeholder="Paste an Instagram caption, a Discord promo, a course sales page or a prop firm's rules…"
            className="mt-3 w-full flex-1 resize-none rounded-lg border border-line2 bg-panel2 px-3 py-2.5 text-[13px] leading-relaxed outline-none focus:border-up"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <ModeBadge mode={willUse} api={api} />
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-dim">
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
              <Btn tone="green" onClick={scan} disabled={busy || text.trim().length < 10}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />}
                {busy ? 'Scanning…' : 'Scan for red flags'}
              </Btn>
            </div>
          </div>
        </Panel>

        {/* pipeline */}
        <Pipeline run={run} />

        {/* report */}
        <div className="col-span-2">
          {run?.notice && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-[12px] text-warn">
              <AlertTriangle size={14} /> {run.notice}
            </div>
          )}
          {run?.status === 'failed' && (
            <div className="flex items-center gap-2 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-[12px] text-down">
              <XCircle size={14} /> {run.error ?? 'The scan failed.'}
            </div>
          )}
          {run?.report && <ReportView report={run.report} mode={run.mode} elapsed={new Date(run.report.scannedAt).getTime() - run.startedAt} />}
        </div>
      </div>
    </div>
  );
}

function ModeBadge({ mode, api }: { mode: Mode; api: 'off' | 'waking' | 'ready' | 'down' }) {
  if (mode === 'workflows')
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-mute">
        <Cloud size={13} className="text-up" />
        Runs on <span className="font-semibold text-ink">Render Workflows</span>
        {api === 'waking' && <span className="text-dim">(waking the API…)</span>}
      </div>
    );
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-mute" title="Set VITE_SCANNER_API_URL to run scans on Render Workflows">
      <Laptop size={13} className="text-warn" />
      Runs in your browser{api === 'down' ? ' (scan API unavailable)' : ''}
    </div>
  );
}

function secs(a?: string, b?: string) {
  if (!a || !b) return '';
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return ms >= 0 ? `${(ms / 1000).toFixed(1)}s` : '';
}

function Pipeline({ run }: { run: Run | null }) {
  const onRender = run?.mode === 'workflows';
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <Label>Pipeline</Label>
        {run && <Tag tone={onRender ? 'green' : 'amber'}>{onRender ? 'Render Workflows' : 'In browser'}</Tag>}
      </div>

      <div className="mt-3 rounded-lg border border-line2 bg-panel2 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[12px] font-semibold">
            scanPost <span className="font-normal text-dim">· root task</span>
          </div>
          <StatusChip state={run ? { status: run.status } : undefined} />
        </div>
        <div className="mt-1 font-mono text-[10px] text-dim">{run?.id ?? (run ? 'local run' : 'waiting for a post')}</div>
      </div>

      <div className="ml-4 border-l border-line2 pl-4">
        {CHECKS.map((c) => {
          const s = run?.checks[c.id];
          const Icon = ICONS[c.id];
          const n = s?.result?.flags.length;
          return (
            <div key={c.id} className={`relative mt-2.5 rounded-lg border px-3 py-2.5 transition ${s?.status === 'running' ? 'border-up/40 bg-up/5' : 'border-line bg-panel'}`}>
              <span className="absolute -left-4 top-1/2 h-px w-4 bg-line2" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={14} className="shrink-0 text-mute" />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold">
                      {c.title} <span className="font-mono text-[10px] font-normal text-dim">{c.task}</span>
                    </div>
                    <div className="truncate text-[11px] text-dim">{s?.result?.note && s.result.status !== 'ok' ? s.result.note : c.blurb}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s?.status === 'succeeded' && s.result?.status === 'ok' && <span className={`font-mono text-[11px] font-bold ${n ? 'text-down' : 'text-up'}`}>{n ? `${n} flag${n === 1 ? '' : 's'}` : 'clean'}</span>}
                  <span className="w-9 text-right font-mono text-[10px] text-dim">{secs(s?.startedAt, s?.completedAt)}</span>
                  <StatusChip state={s} />
                </div>
              </div>
              {onRender && s?.runId && (
                <div className="mt-1 font-mono text-[9px] text-dim">
                  {s.runId}
                  {s.retries ? ` · retried ${s.retries}x` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[11px] leading-relaxed text-dim">
        {onRender
          ? 'Each check is its own Render Workflows task run on its own instance, started in parallel by scanPost and retried automatically if it fails.'
          : 'On Render, each check runs as a separate Workflows task in parallel. Here the same rules run locally.'}
      </div>
    </Panel>
  );
}

function StatusChip({ state }: { state?: CheckState }) {
  const s = state?.status;
  if (!s) return <span className="font-mono text-[10px] text-dim">idle</span>;
  if (state?.result?.status === 'skipped') return <MinusCircle size={14} className="text-dim" />;
  if (state?.result?.status === 'error') return <AlertTriangle size={14} className="text-warn" />;
  if (s === 'succeeded') return <CheckCircle2 size={14} className="text-up" />;
  if (s === 'failed' || s === 'canceled') return <XCircle size={14} className="text-down" />;
  if (s === 'running') return <Loader2 size={14} className="animate-spin text-up" />;
  return <span className="font-mono text-[10px] text-dim">queued</span>;
}

function scoreTone(score: number) {
  return score < 12 ? '#2fd98a' : score < 35 ? '#f5b83d' : '#f2545b';
}

function ReportView({ report, mode, elapsed }: { report: Report; mode: Mode; elapsed: number }) {
  const tone = scoreTone(report.score);
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <Panel className="p-6">
      <div className="flex items-center gap-6">
        <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
          <circle cx="56" cy="56" r={r} fill="none" stroke="#212329" strokeWidth="10" />
          <circle
            cx="56"
            cy="56"
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(report.score / 100) * c} ${c}`}
            transform="rotate(-90 56 56)"
            style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
          />
          <text x="56" y="60" textAnchor="middle" fill="#e7e8eb" fontSize="26" fontWeight="700" fontFamily="Inter">
            {report.score}
          </text>
          <text x="56" y="78" textAnchor="middle" fill="#5b606a" fontSize="9" fontFamily="JetBrains Mono">
            LARP SCORE
          </text>
        </svg>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: tone }} />
            <div className="font-display text-xl font-semibold" style={{ color: tone }}>
              {report.verdict}
            </div>
          </div>
          <div className="mt-1 max-w-xl text-[13px] text-mute">{report.blurb}</div>
          <div className="mt-2 font-mono text-[10px] text-dim">
            {report.flags.length} red flag{report.flags.length === 1 ? '' : 's'} · {report.chars.toLocaleString()} chars · {mode === 'workflows' ? `Render Workflows, ${(elapsed / 1000).toFixed(1)}s end to end` : 'scanned in your browser'}
          </div>
        </div>
      </div>

      {report.flags.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {report.flags.map((f) => (
            <FlagCard key={f.id} flag={f} />
          ))}
        </div>
      )}
      <div className="mt-5 border-t border-line pt-3 text-[11px] text-dim">
        This is a parody site, but the red flags are real. Before paying a trading course, signal group or prop firm, look up the company on the CFTC and SEC sites and search its name with "complaints".
      </div>
    </Panel>
  );
}

const CHECK_LABEL: Record<CheckId, string> = { hype: 'hype', math: 'math', fineprint: 'fine print', ai: 'AI' };

function FlagCard({ flag }: { flag: Flag }) {
  return (
    <div className="rounded-lg border border-line2 bg-panel2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-semibold leading-snug">{flag.label}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Tag tone={flag.check === 'ai' ? 'blue' : 'neutral'}>{CHECK_LABEL[flag.check]}</Tag>
          <span className="font-mono text-[11px] font-bold text-down">+{flag.weight}</span>
        </div>
      </div>
      <div className="mt-1.5 text-[12px] leading-relaxed text-mute">{flag.why}</div>
      {flag.quote && <div className="mt-2 border-l-2 border-down/50 pl-2 font-mono text-[11px] italic text-dim">“{flag.quote}”</div>}
    </div>
  );
}
