import { describe, expect, it } from "vitest";
import { isRetryableError } from "../../lib/claude";

describe("claude — isRetryableError", () => {
  it("returns true for 429 rate limits", () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
  });
  it("returns true for 5xx server errors", () => {
    for (const s of [500, 502, 503, 504]) {
      expect(isRetryableError({ status: s })).toBe(true);
    }
  });
  it("returns true for 408 / 409", () => {
    expect(isRetryableError({ status: 408 })).toBe(true);
    expect(isRetryableError({ status: 409 })).toBe(true);
  });
  it("returns false for 4xx user errors", () => {
    for (const s of [400, 401, 403, 404, 422]) {
      expect(isRetryableError({ status: s })).toBe(false);
    }
  });
  it("returns true for transient network codes", () => {
    expect(isRetryableError({ code: "ECONNRESET" })).toBe(true);
    expect(isRetryableError({ code: "ETIMEDOUT" })).toBe(true);
  });
  it("returns false for null/undefined", () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError("string")).toBe(false);
  });
});
