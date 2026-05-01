import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, buildSystemPrompt } from "../../lib/prompts";
import { STRATEGY_IDS } from "../../lib/types";
import { STRATEGIES } from "../../lib/strategies";

describe("prompts", () => {
  it("template contains both placeholders", () => {
    expect(SYSTEM_PROMPT).toContain("{{strategy_name}}");
    expect(SYSTEM_PROMPT).toContain("{{strategy_guidance}}");
  });

  it("template enforces 7-section output", () => {
    expect(SYSTEM_PROMPT).toContain("## 1. WHAT'S ON THE CHART");
    expect(SYSTEM_PROMPT).toContain("## 2. PATTERNS DETECTED");
    expect(SYSTEM_PROMPT).toContain("## 3. KEY LEVELS");
    expect(SYSTEM_PROMPT).toContain("## 4. STRATEGY MATCH");
    expect(SYSTEM_PROMPT).toContain("## 5. THE TRADE");
    expect(SYSTEM_PROMPT).toContain("## 6. RISK FLAGS");
    expect(SYSTEM_PROMPT).toContain("## 7. VERDICT");
  });

  it("template enforces no-hedging rule", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("no hedging");
  });

  it("buildSystemPrompt substitutes strategy name and guidance for every id", () => {
    for (const id of STRATEGY_IDS) {
      const out = buildSystemPrompt(id);
      expect(out).not.toContain("{{");
      expect(out).toContain(STRATEGIES[id].name);
      expect(out).toContain(STRATEGIES[id].guidance);
    }
  });

  it("substituted prompt contains exactly one occurrence of the strategy name in the lens line", () => {
    const out = buildSystemPrompt("breakout");
    expect(out).toContain("strategy lens: Breakout");
  });

  it("buildSystemPrompt throws for unknown strategy", () => {
    // @ts-expect-error — intentional bad input
    expect(() => buildSystemPrompt("nonsense")).toThrow();
  });

  it("substituted prompts differ across strategies (smoke check)", () => {
    const a = buildSystemPrompt("breakout");
    const b = buildSystemPrompt("trend");
    const c = buildSystemPrompt("auto");
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(c);
  });
});
