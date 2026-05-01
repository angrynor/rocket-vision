import Anthropic from "@anthropic-ai/sdk";
import type { ImageMediaType } from "./types";

export const VISION_MODEL =
  process.env.ROCKET_VISION_MODEL || "claude-sonnet-4-6";
const MAX_TOKENS = 2048;
const RETRY_STATUSES = new Set([408, 409, 429, 500, 502, 503, 504]);
const RETRY_BACKOFF_MS = 750;

export class ClaudeConfigError extends Error {}

let cached: Anthropic | null = null;
function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length === 0) {
    throw new ClaudeConfigError("ANTHROPIC_API_KEY is not set.");
  }
  if (!cached) cached = new Anthropic({ apiKey: key });
  return cached;
}

export function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { status?: number }).status;
  if (typeof status === "number" && RETRY_STATUSES.has(status)) return true;
  const code = (err as { code?: string }).code;
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  )
    return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface AnalyzeStreamArgs {
  systemPrompt: string;
  userText: string;
  mediaType: ImageMediaType;
  imageBase64: string;
  signal?: AbortSignal;
}

/**
 * Streams a vision-grounded analysis from Claude. Retries once on transient
 * pre-stream errors. Returns an async iterable of text deltas.
 */
export async function* streamAnalysis(
  args: AnalyzeStreamArgs,
): AsyncGenerator<string, void, void> {
  const client = getClient();

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = client.messages.stream(
        {
          model: VISION_MODEL,
          max_tokens: MAX_TOKENS,
          system: args.systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: args.mediaType,
                    data: args.imageBase64,
                  },
                },
                { type: "text", text: args.userText },
              ],
            },
          ],
        },
        { signal: args.signal },
      );

      for await (const evt of stream) {
        if (
          evt.type === "content_block_delta" &&
          evt.delta.type === "text_delta"
        ) {
          yield evt.delta.text;
        }
      }
      return;
    } catch (err) {
      lastErr = err;
      if (attempt === 0 && isRetryableError(err)) {
        await sleep(RETRY_BACKOFF_MS);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
