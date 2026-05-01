import { NextRequest } from "next/server";
import { ClaudeConfigError, streamAnalysis } from "@/lib/claude";
import { ImageError, MAX_IMAGE_BYTES, parseDataUrl } from "@/lib/image";
import { buildSystemPrompt, USER_TRIGGER } from "@/lib/prompts";
import { isStrategyId } from "@/lib/strategies";
import type { AnalyzeRequestBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = Math.ceil(MAX_IMAGE_BYTES * (4 / 3)) + 4096;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const cl = req.headers.get("content-length");
  if (cl && Number(cl) > MAX_BODY_BYTES) {
    return jsonError("Request body too large.", 413);
  }

  let body: AnalyzeRequestBody;
  try {
    body = (await req.json()) as AnalyzeRequestBody;
  } catch {
    return jsonError("Body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Body must be an object.", 400);
  }
  if (typeof body.imageBase64 !== "string") {
    return jsonError("Field `imageBase64` is required.", 400);
  }
  if (typeof body.strategy !== "string" || !isStrategyId(body.strategy)) {
    return jsonError(
      "Field `strategy` must be one of: auto, breakout, trend, mean_reversion, smc, reversal.",
      400,
    );
  }

  let parsed;
  try {
    parsed = parseDataUrl(body.imageBase64);
  } catch (e) {
    if (e instanceof ImageError) return jsonError(e.message, e.status);
    return jsonError("Invalid image.", 400);
  }

  const systemPrompt = buildSystemPrompt(body.strategy);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamAnalysis({
          systemPrompt,
          userText: USER_TRIGGER,
          mediaType: parsed.mediaType,
          imageBase64: parsed.base64,
          signal: req.signal,
        })) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        const isConfig = err instanceof ClaudeConfigError;
        if (isConfig) {
          console.error("[analyze] config error:", err.message);
        } else {
          console.error("[analyze] stream error:", err);
        }
        const friendly = isConfig
          ? "\n\n[Server is missing ANTHROPIC_API_KEY. Set it in environment and redeploy.]"
          : "\n\n[Analysis failed. Try again.]";
        try {
          controller.enqueue(encoder.encode(friendly));
        } catch {
          /* stream may already be closed */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
