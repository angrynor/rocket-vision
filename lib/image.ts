import type { ImageMediaType, ParsedImage } from "./types";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_PREFIXES: ReadonlyArray<{ prefix: string; mt: ImageMediaType }> = [
  { prefix: "data:image/png;base64,", mt: "image/png" },
  { prefix: "data:image/jpeg;base64,", mt: "image/jpeg" },
  { prefix: "data:image/jpg;base64,", mt: "image/jpeg" },
  { prefix: "data:image/webp;base64,", mt: "image/webp" },
  { prefix: "data:image/gif;base64,", mt: "image/gif" },
];

export class ImageError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function parseDataUrl(dataUrl: string): ParsedImage {
  if (typeof dataUrl !== "string" || dataUrl.length === 0) {
    throw new ImageError("Image is required.");
  }
  const matched = ALLOWED_PREFIXES.find((p) => dataUrl.startsWith(p.prefix));
  if (!matched) {
    throw new ImageError(
      "Unsupported image format. Use PNG, JPEG, WebP, or GIF.",
    );
  }
  const base64 = dataUrl.slice(matched.prefix.length);
  if (!base64) {
    throw new ImageError("Image payload is empty.");
  }
  if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
    throw new ImageError("Image payload is not valid base64.");
  }
  const cleaned = base64.replace(/\s+/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  const approxBytes = Math.floor((cleaned.length * 3) / 4) - padding;
  if (approxBytes <= 0) {
    throw new ImageError("Image payload is empty after decode.");
  }
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new ImageError(
      `Image is too large. Max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`,
      413,
    );
  }
  return { mediaType: matched.mt, base64: cleaned, approxBytes };
}
