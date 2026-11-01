// scan-api: a tiny web service that starts scanner workflow runs and reports their progress.
// The browser can't hold a Render API key, so it talks to this service instead.
//
//   POST /api/scan        { text }  -> { id }
//   GET  /api/scan/:id              -> { status, checks: { hype: {...}, ... }, report? }
//   GET  /health
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { Render } from '@renderinc/sdk';
import { CHECKS, MAX_CHARS, type CheckId, type CheckResult, type Report } from './checks.js';

const PORT = Number(process.env.PORT) || 8787;
const WORKFLOW = process.env.WORKFLOW_SLUG || 'larp-scanner';
const ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);
const configured = Boolean(process.env.RENDER_API_KEY) || /^(1|t|true)$/i.test(process.env.RENDER_USE_LOCAL_DEV ?? '');

const render = configured ? new Render() : undefined;

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

// Scans this instance started, so the endpoint can't be used to read other runs in the workspace.
const scans = new Map<string, { startedAt: number; children: Map<string, { check: CheckId; state: CheckState }> }>();
const SCAN_TTL_MS = 60 * 60 * 1000;

const norm = (s: string | undefined): Status => (s === 'completed' || s === 'succeeded' ? 'succeeded' : ((s as Status) ?? 'pending'));
const terminal = (s: Status) => s === 'succeeded' || s === 'failed' || s === 'canceled';
const first = <T>(results: unknown): T | undefined => (Array.isArray(results) ? (results[0] as T) : (results as T));

// ---------- rate limit (Hobby workspaces allow 50 root runs per minute) ----------
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  const all = [...hits.values()].reduce((n, list) => n + list.filter((t) => now - t < 60_000).length, 0);
  if (recent.length >= 6 || all >= 40) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// ---------- http helpers ----------
function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  const allow = ORIGINS.includes('*') ? '*' : origin && ORIGINS.includes(origin) ? origin : '';
  if (allow) res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res: ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 64 * 1024) throw Object.assign(new Error('Post is too long'), { code: 413 });
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('Body must be JSON'), { code: 400 });
  }
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// ---------- handlers ----------
async function startScan(req: IncomingMessage, res: ServerResponse) {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim();
  if (limited(ip)) return send(res, 429, { error: 'Too many scans. Wait a minute and try again.' });
  const body = await readJson(req);
  const text = String(body?.text ?? '').slice(0, MAX_CHARS).trim();
  if (text.length < 10) return send(res, 400, { error: 'Paste a longer post to scan.' });
  const run = await render!.workflows.startTask(`${WORKFLOW}/scanPost`, [text]);
  scans.set(run.taskRunId, { startedAt: Date.now(), children: new Map() });
  for (const [id, s] of scans) if (Date.now() - s.startedAt > SCAN_TTL_MS) scans.delete(id);
  send(res, 202, { id: run.taskRunId, workflow: WORKFLOW });
}

async function scanStatus(res: ServerResponse, id: string) {
  const scan = scans.get(id);
  if (!scan) return send(res, 404, { error: 'Unknown or expired scan. Start a new one.' });
  const root = await render!.workflows.getTaskRun(id);

  // Child runs of this scan: one per check. The check id is the first input argument.
  const list = await render!.workflows.listTaskRuns({ rootTaskRunId: [id], limit: 20 });
  await Promise.all(
    list
      .map((r) => r.taskRun)
      .filter((r) => r.id !== id)
      .map(async (r) => {
        const known = scan.children.get(r.id);
        if (known && terminal(known.state.status)) return;
        const d = await render!.workflows.getTaskRun(r.id);
        const input = Array.isArray(d.input) ? d.input[0] : (d.input as any)?.input;
        const check = (input as any)?.check as CheckId | undefined;
        if (!check) return;
        const status = norm(d.status);
        scan.children.set(r.id, {
          check,
          state: {
            status,
            runId: d.id,
            startedAt: d.startedAt,
            completedAt: d.completedAt,
            retries: d.retries,
            result: status === 'succeeded' ? first<CheckResult>(d.results) : undefined,
            error: d.error,
          },
        });
      }),
  );

  const checks: Record<string, CheckState> = Object.fromEntries(CHECKS.map((c) => [c.id, { status: 'pending' as Status }]));
  for (const { check, state } of scan.children.values()) {
    // If a check was retried there can be several runs; prefer the furthest along.
    const prev = checks[check];
    if (!prev?.runId || terminal(state.status) || !terminal(prev.status)) checks[check] = state;
  }

  const status = norm(root.status);
  send(res, 200, {
    id,
    workflow: WORKFLOW,
    status,
    startedAt: root.startedAt,
    completedAt: root.completedAt,
    checks,
    report: status === 'succeeded' ? first<Report>(root.results) : undefined,
    error: root.error,
  });
}

const server = createServer(async (req, res) => {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const url = new URL(req.url ?? '/', 'http://x');
  try {
    if (url.pathname === '/health' || url.pathname === '/') return send(res, 200, { ok: true, configured, workflow: WORKFLOW });
    if (!configured) return send(res, 503, { error: 'Scanner API has no RENDER_API_KEY set.' });
    if (req.method === 'POST' && url.pathname === '/api/scan') return await startScan(req, res);
    const m = url.pathname.match(/^\/api\/scan\/(trn-[A-Za-z0-9]+)$/);
    if (req.method === 'GET' && m) return await scanStatus(res, m[1]);
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    const code = (e as { code?: number }).code;
    console.error('[scan-api]', errMsg(e));
    send(res, typeof code === 'number' ? code : 502, { error: errMsg(e) });
  }
});

server.listen(PORT, () => console.log(`[scan-api] listening on :${PORT} (workflow ${WORKFLOW}, ${configured ? 'configured' : 'NOT configured'})`));
