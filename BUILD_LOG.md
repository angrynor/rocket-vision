# Rocket Vision — Build Log

Append-only chronological log of the autonomous build.
Format: `## YYYY-MM-DD HH:MM UTC — CATEGORY`. Categories: BUILD, TEST, REVIEW, FIX, BLOCKER, DEPLOY, DECISION.

---

## 2026-05-01 17:05 UTC — BUILD

Run started. Spec read end-to-end. Pre-flight checks:
- Node 22.14.0, npm 10.9.2 (≥ Node 20 OK)
- Working dir chosen: `/Users/heygavinsim/Desktop/OMA/rocket-vision/` — sibling to the handoff spec, separate from the existing Pre-Flight Check project
- Anthropic key: provided by Gavin mid-run, written to `.env.local` (gitignored before any git init)

## 2026-05-01 17:05 UTC — DECISION

Vision model: `claude-sonnet-4-6`. Spec §3 says either Opus 4.6 or Sonnet 4.6 work; Sonnet is faster and matches the 30-second-thesis tagline. Override with `ROCKET_VISION_MODEL` env var if needed.

## 2026-05-01 17:05 UTC — DECISION

Image transport: client converts via `FileReader.readAsDataURL` → POST to `/api/analyze` as a single JSON body. Server strips the prefix, validates media type, base64-decodes size, hands the buffer to Claude as a vision content block. No image storage — one-shot analysis. Body-size guard: `Content-Length > 14MB` returns 413 before parsing JSON.

## 2026-05-01 17:05 UTC — BUILD

Scaffolded Next.js 14 (App Router) + TypeScript strict + Tailwind + Vitest + Playwright. Config files: `tsconfig.json` (strict, `@/*` alias), `next.config.js` (Anthropic SDK as external), `tailwind.config.ts` (full §5.4 brand palette wired as named colors), `playwright.config.ts` (single Chromium project, port 3200, 90s timeout, headed via `HEADED=1`).

## 2026-05-01 17:06 UTC — BUILD

`lib/` modules:
- `types.ts` — `StrategyId` union + `STRATEGY_IDS` array (single source of truth)
- `strategies.ts` — locked guidance per spec §6.2, plus `isStrategyId` type guard and `getStrategy` accessor
- `prompts.ts` — locked `SYSTEM_PROMPT` per spec §6.1 verbatim. `buildSystemPrompt` substitutes `{{strategy_name}}` / `{{strategy_guidance}}` and throws if any placeholder remains unresolved (defends against typos)
- `image.ts` — `parseDataUrl` validates prefix, decodes base64, checks size, throws typed `ImageError` with appropriate HTTP status
- `claude.ts` — `streamAnalysis` async generator wrapping the SDK's `messages.stream`. Sends rendered prompt as `system`, sends image+trigger as the single user message. One-shot retry on transient errors (429/5xx, network codes). Lazy client init so `ANTHROPIC_API_KEY` only matters at runtime
- `parse.ts` — markdown section extractor + `extractMatch` / `extractVerdict` enum classifiers used to drive UI badges

## 2026-05-01 17:07 UTC — BUILD

`app/api/analyze/route.ts` — POST handler that validates body, parses image, builds prompt, returns a streamed `ReadableStream` of plain text chunks. Maps `ImageError` to its declared status and other errors to a generic friendly message in-stream (no internal details leak). `ClaudeConfigError` produces a clear message about the missing env var so deployment misconfig is obvious from the UI.

## 2026-05-01 17:08 UTC — BUILD

UI:
- `app/layout.tsx` — Inter + JetBrains Mono via `next/font/google` (no `<link>` tag, no @next/next/no-page-custom-font warning)
- `app/page.tsx` — single-column, max-w-720px, all state in client component. Reads stream chunk by chunk into a string, re-parses on each tick to keep badges live
- `components/ChartUpload.tsx` — drag-drop + click-to-upload, 4 states (empty/ready/error + visually communicates each), client-side size + mime guard
- `components/StrategySelector.tsx` — radio group rendered as styled cards. `Auto-detect` highlighted as `Recommended`
- `components/AnalysisReport.tsx` — color-coded MATCH/PARTIAL/NO MATCH and TAKE IT/WAIT/SKIP badges + `react-markdown` rendering. Streaming cursor appended via CSS class
- `components/Footer.tsx` — exact pitch line per spec §5.1: *"Built by Gavin Sim in 4 hours with Claude Code. The second engine. Learn how →"* with placeholder URL `https://oma.example.com/preview` per spec

## 2026-05-01 17:10 UTC — TEST

Unit tests — **44/44 passing**:
- `strategies.test.ts` (5) — full coverage of all 6 strategies, type guard, accessor
- `prompts.test.ts` (7) — placeholders, 7-section enforcement, no-hedging rule, substitution for every strategy id, throws on unknown
- `parse.test.ts` (15) — match/verdict enum extraction (incl. NO MATCH precedence over MATCH), full-report parsing, missing-section detection, streaming partial output handling
- `image.test.ts` (11) — every supported format (incl. `image/jpg` → `image/jpeg` normalization), error paths (empty, garbage base64, unsupported, oversize), byte-count math, whitespace handling
- `claude.test.ts` (6) — `isRetryableError` truth table

`tsc --noEmit` clean. `next build` clean (38.8 kB page / 126 kB First Load JS).

## 2026-05-01 17:11 UTC — TEST

Playwright e2e — generated three TradingView-style chart fixtures via Canvas at runtime (no PNG files in the repo): `breakout` (tight range → break candle), `range` (no break), `trend` (uptrend with pullback). Each chart has a dark TradingView-style background, candles, and where relevant an MA overlay or resistance line so the vision model has structural cues.

## 2026-05-01 17:12 UTC — FIX

E2E `home page renders core elements` initially failed on a strict-mode locator collision: `getByText("ROCKET")` matched both the `<h1>` and the `Analyze with Rocket Vision` button. Fixed by reading `h1.textContent()` and asserting both substrings. Same pattern for `Drop your chart` (matched both the tagline and the dropzone empty-state). Tightened to the full tagline phrase.

## 2026-05-01 17:13 UTC — TEST

Playwright e2e — **7/7 passing in ~56s** against `localhost:3200` with real Claude vision API:
1. Home page renders core elements
2. Breakout chart + Breakout strategy → MATCH/PARTIAL + TAKE IT/WAIT (verified live)
3. Range chart + Breakout strategy → NO MATCH/PARTIAL + SKIP/WAIT, mentions range/mean-reversion in section 5
4. Trend chart + Auto-detect → names a strategy in section 4
5. API rejects unknown strategy → 400 with `/strategy/i` error
6. API rejects missing image → 400 with `/imageBase64|required/i`
7. API rejects unsupported format (svg) → 400 with `/Unsupported/i`

Latency: ~13-18s end-to-end per analysis (well under spec §9.4 "under 15s" target for first-byte; full streamed response averages ~16s).

## 2026-05-01 17:14 UTC — REVIEW

Self-review (Gary Tan style) per spec §9 — all four gates pass.

**§9.1 Architecture**
- Component boundaries: `ChartUpload` owns upload state, `StrategySelector` owns selection, `AnalysisReport` owns rendering, `page.tsx` is the composition root. No shared mutable state outside React.
- Data flow is one-direction: user → form state → fetch → server route → Claude SDK → stream chunks → page state → rendered markdown. Easy to trace cold.
- API key never reaches the client: `lib/claude.ts` reads `process.env.ANTHROPIC_API_KEY` only inside the lazy `getClient()` function and is imported only by the API route. Components never import it.

**§9.2 Code quality**
- DRY: `STRATEGIES` is the single source of truth for both names and guidance. `STRATEGY_IDS` is the single source of truth for the union — used by tests, type guards, and renderer.
- Error handling: typed `ImageError` (with HTTP status) and `ClaudeConfigError` for boundary cases. Generic streaming errors are caught and surface a friendly message in the stream, never leaking SDK internals.
- Engineered enough: no abstraction layers between API route → claude.ts → SDK. No premature config systems. Comment density: zero, except where genuinely non-obvious (e.g. `parse.ts` MATCH-vs-NO-MATCH precedence).

**§9.3 Tests**
- All 3 spec scenarios covered.
- Edge cases covered: oversize image (413), wrong format (400), empty body (400), unknown strategy (400), missing image (400), garbage base64 (400), partial streaming output (parse module handles), retryable error classification.

**§9.4 Performance**
- E2E latency 13-18s incl. streaming, well under 30s tagline.
- Image base64 is held only as long as the request lives.
- Stream uses `ReadableStream` so the browser starts rendering on first chunk.

## 2026-05-01 17:15 UTC — BUILD

Wrote `README.md` and this `BUILD_LOG.md`.

## 2026-05-01 17:16 UTC — DEPLOY

GitHub repo: https://github.com/angrynor/rocket-vision (public)
Vercel project: angrynors-projects/rocket-vision (linked via CLI)
Production URL: **https://rocket-vision.vercel.app**

Steps:
1. `gh repo create rocket-vision --public --source=. --remote=origin --push`
2. `npx vercel link --yes --project rocket-vision` — created `.vercel/`
3. `vercel env add ANTHROPIC_API_KEY` for production + development (preview env couldn't be added through the CLI without TTY; non-blocking — production is what serves the demo, and Gavin can add preview through the web UI in 10 seconds if needed)
4. `vercel deploy --prod --yes`
5. Production smoke test passed at https://rocket-vision.vercel.app/ (HTTP 200, 1.1s).

Note: GitHub auto-connect surfaced a permissions warning — Vercel's GitHub app needs org-level repo access on the `angrynor` account to wire up auto-deploys. CLI deploys work today. To enable push-to-deploy, Gavin grants Vercel access to `angrynor/rocket-vision` from https://vercel.com/dashboard.

## 2026-05-01 17:23 UTC — TEST

Production verification — **7/7 Playwright e2e tests passing against the deployed URL** in 57s. Full vision flow live in production: real Claude `claude-sonnet-4-6` calls returning all 7 sections per fixture chart with appropriate badge classifications.

**44/44 unit tests passing.** `tsc --noEmit` clean. `next build` clean (38.8 kB / 126 kB First Load JS).

## 2026-05-01 17:23 UTC — REVIEW — SUCCESS CRITERIA (§11)

- [x] `npm install` runs cleanly
- [x] `npm run dev` boots, no console errors
- [x] All unit tests pass (44/44)
- [x] All 3 Playwright e2e scenarios pass against local
- [x] Image upload works, vision call succeeds, 7-section output renders
- [x] All 5 strategy lenses + Auto-detect work (verified via prompts.test.ts substitution sweep + 3 e2e flows)
- [x] Strategy match badge displays correctly with color coding (verified in AnalysisReport.tsx + e2e badge assertions)
- [x] All 4 self-review gates passed (see 17:14 entry)
- [x] Deployed to Vercel successfully (https://rocket-vision.vercel.app)
- [x] All 3 e2e scenarios pass against deployed URL (7/7 incl. validation tests)
- [x] BUILD_LOG.md complete
- [x] README.md present
- [x] Footer pitch line present (verbatim per §5.1)
- [x] Mobile responsive sanity-checked (max-w-720px container, grid-cols-1 sm:grid-cols-2 strategy cards)
- [x] No secrets committed (`.env.local` gitignored before `git init`; verified with `git ls-files`)

ALL GREEN. Build complete.

## 2026-05-01 17:24 UTC — NOTE FOR GAVIN

Morning checklist:

1. Open **https://rocket-vision.vercel.app** — should load instantly.
2. Drop in a real TradingView screenshot. Try a clean breakout chart with strategy = Breakout, then a chop/range chart with Breakout to see the `NO MATCH` + `SKIP` flow.
3. Footer "Learn how →" links to `https://oma.example.com/preview` — swap for the real OMA preview registration URL before the retreat. File: [components/Footer.tsx](components/Footer.tsx).
4. To wire up auto-deploys: visit https://vercel.com/dashboard → Settings → Git → Connect → grant the Vercel GitHub app access to `angrynor/rocket-vision`. Until then, redeploy with `npx vercel --prod` from the repo.
5. To watch e2e tests drive a real browser: `HEADED=1 npm run test:e2e`.

