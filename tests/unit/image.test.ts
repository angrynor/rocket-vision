import { describe, expect, it } from "vitest";
import { ImageError, MAX_IMAGE_BYTES, parseDataUrl } from "../../lib/image";

const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP8//8/AwAI/AL+ZxJP/AAAAABJRU5ErkJggg==";

describe("image — parseDataUrl", () => {
  it("parses a valid PNG data URL", () => {
    const res = parseDataUrl(`data:image/png;base64,${TINY_PNG_B64}`);
    expect(res.mediaType).toBe("image/png");
    expect(res.base64).toBe(TINY_PNG_B64);
    expect(res.approxBytes).toBeGreaterThan(0);
  });

  it("parses JPEG data URL", () => {
    const res = parseDataUrl(`data:image/jpeg;base64,${TINY_PNG_B64}`);
    expect(res.mediaType).toBe("image/jpeg");
  });

  it("normalizes image/jpg → image/jpeg", () => {
    const res = parseDataUrl(`data:image/jpg;base64,${TINY_PNG_B64}`);
    expect(res.mediaType).toBe("image/jpeg");
  });

  it("parses WebP and GIF data URLs", () => {
    expect(parseDataUrl(`data:image/webp;base64,${TINY_PNG_B64}`).mediaType).toBe(
      "image/webp",
    );
    expect(parseDataUrl(`data:image/gif;base64,${TINY_PNG_B64}`).mediaType).toBe(
      "image/gif",
    );
  });

  it("throws ImageError on empty string", () => {
    expect(() => parseDataUrl("")).toThrow(ImageError);
  });

  it("throws ImageError on missing prefix", () => {
    expect(() => parseDataUrl("notadataurl")).toThrow(/Unsupported/);
  });

  it("throws ImageError on unsupported media type", () => {
    expect(() =>
      parseDataUrl(`data:image/svg+xml;base64,${TINY_PNG_B64}`),
    ).toThrow(/Unsupported/);
  });

  it("throws ImageError on garbage base64", () => {
    expect(() => parseDataUrl(`data:image/png;base64,!!!!`)).toThrow(
      /not valid base64/,
    );
  });

  it("throws 413 ImageError when over 10MB", () => {
    const tooLarge = "A".repeat(Math.ceil(MAX_IMAGE_BYTES * (4 / 3)) + 16);
    try {
      parseDataUrl(`data:image/png;base64,${tooLarge}`);
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ImageError);
      expect((e as ImageError).status).toBe(413);
      expect((e as ImageError).message).toMatch(/too large/i);
    }
  });

  it("computes approxBytes correctly for known input", () => {
    // "AAAA" base64 → 3 bytes (no padding).
    const res = parseDataUrl(`data:image/png;base64,AAAA`);
    expect(res.approxBytes).toBe(3);
  });

  it("handles base64 with whitespace", () => {
    const padded = TINY_PNG_B64.match(/.{1,16}/g)!.join("\n");
    const res = parseDataUrl(`data:image/png;base64,${padded}`);
    expect(res.base64).toBe(TINY_PNG_B64);
    expect(res.mediaType).toBe("image/png");
  });
});
