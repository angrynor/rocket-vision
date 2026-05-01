import { SECTION_HEADINGS, type StrategyMatch, type Verdict } from "./types";

export interface ParsedSection {
  readonly index: number;
  readonly heading: string;
  readonly body: string;
}

export interface ParsedReport {
  readonly sections: ReadonlyArray<ParsedSection>;
  readonly match: StrategyMatch | null;
  readonly verdict: Verdict | null;
  readonly missing: ReadonlyArray<string>;
}

const HEADING_RE = /^##\s*\d+\.\s*([A-Z'][A-Z'\s]+?)\s*$/gm;

export function parseReport(markdown: string): ParsedReport {
  const sections: ParsedSection[] = [];
  const matches: { idx: number; heading: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(markdown)) !== null) {
    matches.push({
      idx: matches.length,
      heading: m[1].trim().toUpperCase(),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const body = markdown
      .slice(cur.end, next ? next.start : markdown.length)
      .trim();
    sections.push({ index: i + 1, heading: cur.heading, body });
  }

  const headingsSeen = new Set(sections.map((s) => s.heading));
  const missing = SECTION_HEADINGS.filter((h) => !headingsSeen.has(h));

  const matchSection = sections.find((s) => s.heading === "STRATEGY MATCH");
  const verdictSection = sections.find((s) => s.heading === "VERDICT");

  return {
    sections,
    match: extractMatch(matchSection?.body ?? ""),
    verdict: extractVerdict(verdictSection?.body ?? ""),
    missing,
  };
}

export function extractMatch(text: string): StrategyMatch | null {
  const upper = text.toUpperCase();
  // Order matters: NO MATCH must be checked before MATCH.
  if (/\bNO[\s-]*MATCH\b/.test(upper)) return "NO MATCH";
  if (/\bPARTIAL\b/.test(upper)) return "PARTIAL";
  if (/\bMATCH\b/.test(upper)) return "MATCH";
  return null;
}

export function extractVerdict(text: string): Verdict | null {
  const upper = text.toUpperCase();
  if (/\bTAKE\s+IT\b/.test(upper)) return "TAKE IT";
  if (/\bSKIP\b/.test(upper)) return "SKIP";
  if (/\bWAIT\b/.test(upper)) return "WAIT";
  return null;
}
