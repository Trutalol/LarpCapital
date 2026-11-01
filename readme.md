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

Parody trading-course site, linked from the "Buy my course" button in LarpCapital's sidebar: course tiers, Chase Larpington's "A+ strategy", AI lifestyle photos, fake student success stories and a checkout with pre-checked upsells. "Complete purchase" never takes payment (there are no card fields); it reveals the joke, lists real red flags of trading-course scams and links back to LarpCapital.

```bash
cd course-site
npm install
npm install     # once; then LarpCapital's `npm run dev` serves it at http://localhost:5173/course/
```

In dev, `frontend/vite.config.ts` starts the course-site dev server (port 5175) and proxies `/course` to it, so both sites run from one localhost. `npm run dev` inside `course-site/` still works on its own (http://localhost:5175/course/).

Env vars (build-time): `VITE_API_URL` (Gemini backend: `POST /api/image {scene: "lambo"|"penthouse"|"dubai"|"yacht"|"jet"}` → `{image: "data:image/png;base64,..."}`; gradient placeholders otherwise; CORS must allow the site) and `VITE_LARPCAPITAL_URL` (link back to the main site). Deployed as the second static site in `render.yaml`.

LarpCapital reads `VITE_COURSE_URL` for the sidebar button (defaults to `/course/` in dev).
