# larphacks

**LarpCapital** — a prop-firm larp. Buy a (fake) futures evaluation, trade a simulated market, pass or breach, get "funded", request payouts and download certificates. Paper trading only.

## Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # static build in frontend/dist
```

Stack: Vite + React + TypeScript, Tailwind, zustand (state persisted to localStorage), lightweight-charts for candles, html-to-image for certificate PNGs.

- `src/lib/market.ts` — simulated price feed (NQ/ES/CL/GC + micros), 1m candles, speed control
- `src/lib/store.ts` — accounts, order matching (market/limit/stop + TP/SL brackets), rule engine (MLL, EOD/intraday trailing, DLL, profit target), payouts, certificates
- `src/lib/plans.ts` — LarpFlex / LarpPro evaluation rules

Demo tips: use the speed buttons (1x–60x) on the Trade page, and "Settle day" to roll the session (updates EOD drawdown and the P&L calendar). In dev, `window.__app` / `window.__market` expose the stores.

## Larp Academy (`course-site/`)

Parody trading-course storefront. It's the "Course website" tool in LarpCapital's Larp Studio (`/studio?tool=course`, next to Flex photos), shown in a browser-frame preview with an "Open full site" button. It's a full guru shop: a landing page (Chase Larpington's "A+ strategy", AI lifestyle photos, fake success stories), a course catalog with categories/search/sort, course detail pages (curriculum, instructor, reviews), a cart, a fake checkout (pre-checked upsells, coupon codes LARP / CHASE90 / FREE), an order confirmation that reveals the joke and lists real red flags of trading-course scams, and My Courses: a lesson player with progress, a locked "bonus" lesson that upsells the next course, and a certificate of completion.

Checkout never takes payment (there are no card fields). Cart, purchases and progress live in localStorage (`larp-academy-v1`). Pages use hash routes (`#/courses/larp-model`, `#/library`, ...) so they work under the `/course` proxy and as a static site with no rewrites.

- `src/data.ts`: courses, instructors, curriculum, upsells, coupons, red flags
- `src/store.ts`: cart / orders / owned courses / lesson progress
- `src/pages/`: Home, Catalog, CourseDetail, Cart, Checkout, Order, Library, Learn

```bash
cd course-site
npm install
npm install     # once; then LarpCapital's `npm run dev` serves it at http://localhost:5173/course/
```

In dev, `frontend/vite.config.ts` starts the course-site dev server (port 5175) and proxies `/course` to it, so both sites run from one localhost. `npm run dev` inside `course-site/` still works on its own (http://localhost:5175/course/).

Env vars (build-time): `VITE_API_URL` (Gemini backend: `POST /api/image {scene: "lambo"|"penthouse"|"dubai"|"yacht"|"jet"}` → `{image: "data:image/png;base64,..."}`; gradient placeholders otherwise; CORS must allow the site) and `VITE_LARPCAPITAL_URL` (link back to the main site). Deployed as the second static site in `render.yaml`.

LarpCapital reads `VITE_COURSE_URL` for the Larp Studio course tool (defaults to `/course/` in dev).

## Red Flag Scanner (`scanner/`, Render Workflows)

`/scanner` in LarpCapital: paste a guru post, course ad or prop firm offer and get a 0–100 "Larp Score" with every red flag explained (guaranteed returns, fake urgency, "$500 to $50k in 30 days" turned into daily compounding, activation fees, payout caps, trailing drawdowns, and so on). Three sample posts are built in for the demo.

How it runs on Render:

- **`larp-scanner` (Render Workflow, `scanner/src/index.ts`)**: the root task `scanPost` fans out four tasks in parallel with `ctx.run`, `hypeCheck`, `mathCheck`, `fineprintCheck` and `aiCheck`, each on its own instance with automatic retries, then merges them into one report. `aiCheck` calls Gemini only if `GEMINI_API_KEY` is set on the workflow, otherwise it reports "skipped".
- **`larp-scan-api` (free web service, `scanner/src/api.ts`)**: holds `RENDER_API_KEY`, starts `larp-scanner/scanPost` runs (`POST /api/scan`), and reports the root run plus each check's child run (`GET /api/scan/:id`) so the page can light up each check as it finishes. It only reports runs it started and rate-limits scans.
- **Frontend**: reads `VITE_SCANNER_API_URL`. Without it, or if the API is unreachable, the page runs the same rules in the browser (`frontend/src/lib/redflags.ts` is a synced copy of `scanner/src/checks.ts`, so edit the scanner copy and run `npm run sync` in `scanner/`).

```bash
cd scanner
npm install
npm test        # builds and runs the rules against the sample posts
# with the Render CLI (2.12+): run the tasks locally on :8120
render workflows dev -- npm start
# in another terminal: the API, pointed at the local task server (PowerShell)
$env:RENDER_USE_LOCAL_DEV="true"; npm run start:api     # http://localhost:8787
# then in frontend/ (PowerShell)
$env:VITE_SCANNER_API_URL="http://localhost:8787"; npm run dev
```

Deploying: the Blueprint adds both services. Set `RENDER_API_KEY` on `larp-scan-api` (Account settings → API keys) and optionally `GEMINI_API_KEY` on `larp-scanner`. Workflows bill per second of compute (Flex plan, about $0.20 per CPU-hour), so a scan costs a fraction of a cent. If the workflow's slug in the dashboard isn't `larp-scanner`, set `WORKFLOW_SLUG` on the API to match.
