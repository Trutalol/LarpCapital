// Copies src/checks.ts into the frontend so the browser fallback runs the exact same rules.
// Run after editing checks.ts: `npm run sync` (from scanner/).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src/checks.ts', import.meta.url));
const dest = fileURLToPath(new URL('../../frontend/src/lib/redflags.ts', import.meta.url));
const header = '// GENERATED from scanner/src/checks.ts by `npm run sync` in scanner/. Edit that file, not this one.\n';
writeFileSync(dest, header + readFileSync(src, 'utf8'));
console.log('synced checks.ts -> frontend/src/lib/redflags.ts');
