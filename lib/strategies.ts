import type { Strategy, StrategyId } from "./types";

export const STRATEGIES: Record<StrategyId, Strategy> = {
  auto: {
    id: "auto",
    name: "Auto-detect",
    blurb: "AI picks the best-fitting strategy",
    guidance:
      "Identify the strategy that best fits this chart's structure. Common options: Breakout, Trend Continuation, Mean Reversion, Smart Money Concepts, Reversal. Pick the one with strongest evidence. Name it explicitly in section 4.",
  },
  breakout: {
    id: "breakout",
    name: "Breakout",
    blurb: "range break, structure break, S/R break",
    guidance:
      "A valid breakout setup needs: a clear consolidation or range, a defined breakout level (range high or structural high), a breakout candle with volume or strong close, and clean structure above. Reject if the chart is mid-range, in a trend, or showing a wick-only break with no follow-through.",
  },
  trend: {
    id: "trend",
    name: "Trend Continuation",
    blurb: "pullback to MA or trendline in established trend",
    guidance:
      "A valid trend continuation setup needs: a clear established trend (higher highs and higher lows for long, opposite for short), a recent pullback to a logical level (MA, trendline, prior breakout), and signs of trend resumption (rejection candles, volume on bounce). Reject if trend is weakening, structure is breaking, or pullback hasn't completed.",
  },
  mean_reversion: {
    id: "mean_reversion",
    name: "Mean Reversion",
    blurb: "buy support, sell resistance in a range",
    guidance:
      "A valid mean reversion setup needs: a clear range with defined support and resistance, price at one of those extremes, signs of rejection (wick, divergence, volume drop), and stable range structure. Reject if price is breaking out of range, trend is forming, or structure is shifting.",
  },
  smc: {
    id: "smc",
    name: "Smart Money Concepts",
    blurb: "liquidity grabs, order blocks, FVGs",
    guidance:
      "A valid SMC setup needs: identification of a liquidity grab (sweep of recent high or low), an order block (last opposing candle before strong move), or a fair value gap (imbalance), AND a return to that zone. Look for change of character, market structure shift. Reject if the chart shows pure trend or range without these specific structures.",
  },
  reversal: {
    id: "reversal",
    name: "Reversal",
    blurb: "catching tops and bottoms",
    guidance:
      "A valid reversal setup needs: an exhausted prior trend, a clear reversal pattern (double top/bottom, head and shoulders, divergence on indicators), confirmation (lower high after high in a top, higher low after low in a bottom), and a defined invalidation level. Reject if trend is still strong with no exhaustion, or pattern is incomplete.",
  },
};

export function isStrategyId(s: string): s is StrategyId {
  return Object.prototype.hasOwnProperty.call(STRATEGIES, s);
}

export function getStrategy(s: StrategyId): Strategy {
  return STRATEGIES[s];
}
