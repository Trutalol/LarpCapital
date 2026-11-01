// Render Workflows entry point: registers the scanner tasks.
// On Render (or under `render workflows dev`) the SDK starts the task server automatically
// once these task() calls have run.
import { task, type TaskContext } from '@renderinc/sdk/workflows';
import { buildReport, MAX_CHARS, runCheck, type CheckInput, type CheckResult, type Report } from './checks.js';

const quick = { timeoutSeconds: 60, retry: { maxRetries: 2, waitDurationMs: 500, backoffScaling: 2 } };

export const hypeCheck = task({ name: 'hypeCheck', ...quick }, (_ctx: TaskContext, input: CheckInput) => runCheck(input));
export const mathCheck = task({ name: 'mathCheck', ...quick }, (_ctx: TaskContext, input: CheckInput) => runCheck(input));
export const fineprintCheck = task({ name: 'fineprintCheck', ...quick }, (_ctx: TaskContext, input: CheckInput) => runCheck(input));

// Calls Gemini when GEMINI_API_KEY is set on the workflow service; otherwise reports "skipped".
export const aiCheck = task(
  { name: 'aiCheck', timeoutSeconds: 120, retry: { maxRetries: 1, waitDurationMs: 1000, backoffScaling: 2 } },
  (_ctx: TaskContext, input: CheckInput) => runCheck(input, { geminiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL }),
);

/** Root task: fans out the four checks in parallel (each on its own instance), then scores the results. */
export const scanPost = task(
  { name: 'scanPost', timeoutSeconds: 300, retry: { maxRetries: 0, waitDurationMs: 1000, backoffScaling: 2 } },
  async (ctx: TaskContext, text: string): Promise<Report> => {
    const body = String(text ?? '').slice(0, MAX_CHARS).trim();
    if (!body) throw new Error('Nothing to scan: paste a post first.');
    const results: CheckResult[] = await Promise.all([
      ctx.run(hypeCheck, { check: 'hype', text: body }),
      ctx.run(mathCheck, { check: 'math', text: body }),
      ctx.run(fineprintCheck, { check: 'fineprint', text: body }),
      ctx.run(aiCheck, { check: 'ai', text: body }),
    ]);
    return buildReport(body, results);
  },
);
