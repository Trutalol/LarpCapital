// Quick sanity test for the rules: runs every sample through the checks (no Render, no network).
import { SAMPLES, runCheck, buildReport } from '../dist/checks.js';

let failed = 0;
for (const s of SAMPLES) {
  const results = await Promise.all(['hype', 'math', 'fineprint', 'ai'].map((check) => runCheck({ check, text: s.text })));
  const r = buildReport(s.text, results);
  console.log(`\n${s.label}: ${r.score}/100 ${r.verdict} (${r.flags.length} flags)`);
  for (const f of r.flags) console.log(`  [${f.check}] +${f.weight} ${f.label}`);
  if (s.id === 'honest' && r.score > 20) (failed++, console.error('  FAIL: honest sample scored too high'));
  if (s.id !== 'honest' && r.score < 60) (failed++, console.error('  FAIL: scam sample scored too low'));
}
process.exit(failed ? 1 : 0);
