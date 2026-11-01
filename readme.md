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
