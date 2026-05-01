import { describe, expect, it } from "vitest";
import {
  STRATEGIES,
  getStrategy,
  isStrategyId,
} from "../../lib/strategies";
import { STRATEGY_IDS } from "../../lib/types";

describe("strategies", () => {
  it("defines all 6 strategies", () => {
    expect(Object.keys(STRATEGIES).sort()).toEqual(
      [...STRATEGY_IDS].sort(),
    );
  });

  it("each strategy has non-empty name, blurb, and guidance", () => {
    for (const id of STRATEGY_IDS) {
      const s = STRATEGIES[id];
      expect(s.id).toBe(id);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.blurb.length).toBeGreaterThan(0);
      expect(s.guidance.length).toBeGreaterThan(40);
    }
  });

  it("isStrategyId rejects unknown ids", () => {
    expect(isStrategyId("auto")).toBe(true);
    expect(isStrategyId("breakout")).toBe(true);
    expect(isStrategyId("smc")).toBe(true);
    expect(isStrategyId("nonsense")).toBe(false);
    expect(isStrategyId("")).toBe(false);
    expect(isStrategyId("AUTO")).toBe(false);
  });

  it("getStrategy returns the correct strategy for each id", () => {
    expect(getStrategy("breakout").name).toBe("Breakout");
    expect(getStrategy("trend").name).toBe("Trend Continuation");
    expect(getStrategy("mean_reversion").name).toBe("Mean Reversion");
    expect(getStrategy("smc").name).toBe("Smart Money Concepts");
    expect(getStrategy("reversal").name).toBe("Reversal");
    expect(getStrategy("auto").name).toBe("Auto-detect");
  });

  it("guidance text mentions reject conditions for non-auto strategies", () => {
    const nonAuto = STRATEGY_IDS.filter((s) => s !== "auto");
    for (const id of nonAuto) {
      expect(STRATEGIES[id].guidance.toLowerCase()).toMatch(/reject/);
    }
  });
});
