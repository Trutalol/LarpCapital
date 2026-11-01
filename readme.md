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
