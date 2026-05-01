import { describe, expect, it } from "vitest";
import { extractMatch, extractVerdict, parseReport } from "../../lib/parse";

const FULL_REPORT = `## 1. WHAT'S ON THE CHART
BTC/USDT 4h. Uptrend. Last 8 candles broke above $74,500 with volume.

## 2. PATTERNS DETECTED
Ascending triangle break. Pullback to the broken resistance turned support.

## 3. KEY LEVELS
Support: $74,500
Resistance: $78,200
Major: $80,000

## 4. STRATEGY MATCH
MATCH. Clean range break with retest in progress.

## 5. THE TRADE
Entry: $75,100. Stop: $73,800. Target: $78,200. R:R ~2.4. Size 1% of account on the stop.

## 6. RISK FLAGS
Failed retest below $74,500 invalidates. Watch BTC dominance.

## 7. VERDICT
TAKE IT. Structure aligns with strategy and momentum is intact.
`;

describe("parse — extractMatch", () => {
  it("returns MATCH on plain match", () => {
    expect(extractMatch("MATCH. clean break.")).toBe("MATCH");
  });
  it("returns PARTIAL", () => {
    expect(extractMatch("PARTIAL — missing volume confirmation.")).toBe("PARTIAL");
  });
  it("returns NO MATCH (with hyphen variant)", () => {
    expect(extractMatch("NO MATCH. Mid-range.")).toBe("NO MATCH");
    expect(extractMatch("NO-MATCH. mid range.")).toBe("NO MATCH");
  });
  it("prefers NO MATCH over MATCH when both substrings present", () => {
    expect(extractMatch("NO MATCH — this is not a clean MATCH.")).toBe(
      "NO MATCH",
    );
  });
  it("returns null for unrelated text", () => {
    expect(extractMatch("the chart is choppy")).toBeNull();
  });
});

describe("parse — extractVerdict", () => {
  it("returns TAKE IT", () => {
    expect(extractVerdict("TAKE IT. Aligned with structure.")).toBe("TAKE IT");
  });
  it("returns WAIT", () => {
    expect(extractVerdict("WAIT for a confirmed retest.")).toBe("WAIT");
  });
  it("returns SKIP", () => {
    expect(extractVerdict("SKIP — no edge.")).toBe("SKIP");
  });
  it("returns null for unrelated text", () => {
    expect(extractVerdict("this is a chart")).toBeNull();
  });
});

describe("parse — parseReport", () => {
  it("parses 7 sections in order with correct headings", () => {
    const r = parseReport(FULL_REPORT);
    expect(r.sections.map((s) => s.heading)).toEqual([
      "WHAT'S ON THE CHART",
      "PATTERNS DETECTED",
      "KEY LEVELS",
      "STRATEGY MATCH",
      "THE TRADE",
      "RISK FLAGS",
      "VERDICT",
    ]);
    expect(r.missing).toEqual([]);
  });

  it("extracts MATCH and TAKE IT from full report", () => {
    const r = parseReport(FULL_REPORT);
    expect(r.match).toBe("MATCH");
    expect(r.verdict).toBe("TAKE IT");
  });

  it("flags missing sections", () => {
    const partial = FULL_REPORT.replace(/## 7\. VERDICT[\s\S]*$/, "");
    const r = parseReport(partial);
    expect(r.missing).toContain("VERDICT");
    expect(r.verdict).toBeNull();
  });

  it("handles streaming partial output without crashing", () => {
    const partial = `## 1. WHAT'S ON THE CHART\nBTC 4h, ranging.\n\n## 2. PATTERNS DETECTED\nrange.`;
    const r = parseReport(partial);
    expect(r.sections.length).toBe(2);
    expect(r.match).toBeNull();
    expect(r.verdict).toBeNull();
    expect(r.missing.length).toBeGreaterThanOrEqual(5);
  });

  it("returns NO MATCH + SKIP correctly", () => {
    const text = FULL_REPORT
      .replace("MATCH. Clean range break with retest in progress.", "NO MATCH. Mid-range, no break.")
      .replace("TAKE IT. Structure aligns with strategy and momentum is intact.", "SKIP. Wrong strategy for this chart.");
    const r = parseReport(text);
    expect(r.match).toBe("NO MATCH");
    expect(r.verdict).toBe("SKIP");
  });

  it("returns PARTIAL + WAIT correctly", () => {
    const text = FULL_REPORT
      .replace("MATCH. Clean range break with retest in progress.", "PARTIAL — break without volume.")
      .replace("TAKE IT. Structure aligns with strategy and momentum is intact.", "WAIT for confirmation.");
    const r = parseReport(text);
    expect(r.match).toBe("PARTIAL");
    expect(r.verdict).toBe("WAIT");
  });
});
