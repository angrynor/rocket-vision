export type StrategyId =
  | "auto"
  | "breakout"
  | "trend"
  | "mean_reversion"
  | "smc"
  | "reversal";

export const STRATEGY_IDS: ReadonlyArray<StrategyId> = [
  "auto",
  "breakout",
  "trend",
  "mean_reversion",
  "smc",
  "reversal",
];

export interface Strategy {
  readonly id: StrategyId;
  readonly name: string;
  readonly blurb: string;
  readonly guidance: string;
}

export type ImageMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

export interface ParsedImage {
  readonly mediaType: ImageMediaType;
  readonly base64: string;
  readonly approxBytes: number;
}

export interface AnalyzeRequestBody {
  imageBase64: string;
  strategy: StrategyId;
}

export type StrategyMatch = "MATCH" | "PARTIAL" | "NO MATCH";
export type Verdict = "TAKE IT" | "WAIT" | "SKIP";

export const SECTION_HEADINGS: ReadonlyArray<string> = [
  "WHAT'S ON THE CHART",
  "PATTERNS DETECTED",
  "KEY LEVELS",
  "STRATEGY MATCH",
  "THE TRADE",
  "RISK FLAGS",
  "VERDICT",
];
