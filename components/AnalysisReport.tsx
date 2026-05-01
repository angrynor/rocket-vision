"use client";

import ReactMarkdown from "react-markdown";
import { extractMatch, extractVerdict, parseReport } from "@/lib/parse";
import type { StrategyMatch, Verdict } from "@/lib/types";

interface Props {
  markdown: string;
  streaming: boolean;
  error?: string | null;
}

export default function AnalysisReport({ markdown, streaming, error }: Props) {
  if (error) {
    return (
      <div
        className="mt-6 rounded-xl border border-bear/40 bg-bear/10 px-4 py-3"
        data-testid="report-error"
      >
        <p className="text-bear font-medium">{error}</p>
      </div>
    );
  }
  if (!markdown && !streaming) return null;

  const parsed = parseReport(markdown);

  return (
    <section className="mt-8" data-testid="analysis-report">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <MatchBadge match={parsed.match} />
        <VerdictBadge verdict={parsed.verdict} />
        {streaming && (
          <span
            className="text-xs uppercase tracking-wider text-accent ml-auto"
            data-testid="streaming-indicator"
          >
            Analyzing…
          </span>
        )}
      </div>

      <article
        className={`report bg-surface rounded-2xl px-5 py-4 ${
          streaming ? "streaming-cursor" : ""
        }`}
        data-testid="report-body"
      >
        <ReactMarkdown>{markdown || ""}</ReactMarkdown>
      </article>

      {!streaming && parsed.missing.length > 0 && markdown.length > 50 && (
        <p className="mt-3 text-xs text-warn" data-testid="missing-sections">
          Heads up: {parsed.missing.length} expected section
          {parsed.missing.length === 1 ? "" : "s"} missing (
          {parsed.missing.join(", ")}).
        </p>
      )}
    </section>
  );
}

function MatchBadge({ match }: { match: StrategyMatch | null }) {
  if (!match)
    return (
      <Badge color="muted" label="STRATEGY MATCH: …" testId="match-badge" />
    );
  const color: BadgeColor =
    match === "MATCH" ? "bull" : match === "PARTIAL" ? "warn" : "bear";
  return (
    <Badge color={color} label={`STRATEGY MATCH: ${match}`} testId="match-badge" />
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict | null }) {
  if (!verdict)
    return <Badge color="muted" label="VERDICT: …" testId="verdict-badge" />;
  const color: BadgeColor =
    verdict === "TAKE IT" ? "bull" : verdict === "WAIT" ? "warn" : "bear";
  return (
    <Badge color={color} label={`VERDICT: ${verdict}`} testId="verdict-badge" />
  );
}

type BadgeColor = "bull" | "warn" | "bear" | "muted";
function Badge({
  color,
  label,
  testId,
}: {
  color: BadgeColor;
  label: string;
  testId: string;
}) {
  const tone =
    color === "bull"
      ? "bg-bull/15 text-bull border-bull/40"
      : color === "warn"
      ? "bg-warn/15 text-warn border-warn/40"
      : color === "bear"
      ? "bg-bear/15 text-bear border-bear/40"
      : "bg-[#2A2A2D] text-muted border-[#2A2A2D]";
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold tracking-wide ${tone}`}
      data-testid={testId}
    >
      {label}
    </span>
  );
}

// Re-export for tests / debug (keeps parse module the source of truth).
export { extractMatch, extractVerdict };
