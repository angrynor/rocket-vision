# Rocket Vision

A vision-powered chart analyzer for crypto perp traders. Drop a chart screenshot, pick the strategy lens you trade, get a 7-section thesis in ~15 seconds.

Built for the Crypto Rocket Profits retreat (May 2026).

## What it does

You upload a TradingView screenshot and pick one of six strategy lenses (Auto-detect, Breakout, Trend Continuation, Mean Reversion, Smart Money Concepts, Reversal). The server sends the image to Claude with a strategy-specific system prompt and streams a structured 7-section response back:

1. WHAT'S ON THE CHART
2. PATTERNS DETECTED
3. KEY LEVELS
4. STRATEGY MATCH (color-coded badge)
5. THE TRADE — entry / stop / target / R:R / sizing
6. RISK FLAGS
7. VERDICT (color-coded badge)

Voice is firm and protective — no hedging, citations only. Tells you to skip if your chart doesn't fit your strategy.

## Stack

- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS
- @anthropic-ai/sdk (vision + streaming)
- Vitest (unit) + Playwright (e2e)
- Vercel for hosting

## Setup

```bash
npm install
cp .env.local.example .env.local
# put your real key in .env.local
npm run dev
# open http://localhost:3000
```

You need an Anthropic API key from https://console.anthropic.com/.

## Scripts

```bash
npm run dev          # dev server (default port 3000)
npm run build        # production build
npm run start        # serve production build
npm run typecheck    # tsc --noEmit
npm test             # unit tests (vitest)
npm run test:watch   # unit tests in watch mode
npm run test:e2e     # Playwright tests against running dev server
```

### Watching e2e tests in a real browser

By default Playwright runs Chromium headless. To see the browser drive the page:

```bash
HEADED=1 npm run test:e2e
```

## Deploy

Set `ANTHROPIC_API_KEY` in Vercel project settings, push to the connected GitHub repo, done.

## Project structure

```
app/
  api/analyze/route.ts   # streams vision analysis
  page.tsx, layout.tsx, globals.css
components/              # ChartUpload, StrategySelector, AnalysisReport, Footer
lib/
  types.ts               # StrategyId union, section headings
  strategies.ts          # locked strategy guidance per spec §6.2
  prompts.ts             # locked system prompt per spec §6.1
  image.ts               # data-URL parsing, size + mime guards
  claude.ts              # streamAnalysis async generator
  parse.ts               # parseReport, extractMatch, extractVerdict
tests/
  unit/                  # 44 vitest tests
  e2e/
    fixtures/generate.ts # Canvas-based chart fixture generator
    analyze.spec.ts      # 7 Playwright tests
```

## Notes

- Brand palette is locked (deep matte black, electric cyan accent, emerald MATCH/TAKE, amber PARTIAL/WAIT, red NO MATCH/SKIP).
- The footer pitch line is intentional — it's the soft funnel into the OMA preview event.
- The system prompt is locked verbatim per spec §6.1; do not edit the wording.
- Images are sent in-memory and not stored. 10 MB max.
- Vision model: `claude-sonnet-4-6` (override with `ROCKET_VISION_MODEL` env var).

## Troubleshooting

**Local dev: `ANTHROPIC_API_KEY is not set` even though it's in `.env.local`.**
Some shells (Claude Code, certain CI runners) export `ANTHROPIC_API_KEY=""` (empty). Next.js's env loader respects existing env vars over `.env.local`, so the empty value wins. Fix: `unset ANTHROPIC_API_KEY` before `npm run dev`.

**Tests pass locally but fail on the deployed URL.**
Confirm `ANTHROPIC_API_KEY` is set in Vercel project settings (Settings → Environment Variables). Then redeploy — Vercel does not retroactively apply env vars to existing builds.

## License

Private. Demo project.
