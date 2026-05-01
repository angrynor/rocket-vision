"use client";

import { useCallback, useState } from "react";
import AnalysisReport from "@/components/AnalysisReport";
import ChartUpload, { type UploadState } from "@/components/ChartUpload";
import Footer from "@/components/Footer";
import StrategySelector from "@/components/StrategySelector";
import type { StrategyId } from "@/lib/types";

export default function Page() {
  const [upload, setUpload] = useState<UploadState>({ kind: "empty" });
  const [strategy, setStrategy] = useState<StrategyId>("auto");
  const [markdown, setMarkdown] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = upload.kind === "ready" && !streaming;

  const onAnalyze = useCallback(async () => {
    if (upload.kind !== "ready") return;
    setError(null);
    setMarkdown("");
    setStreaming(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: upload.dataUrl,
          strategy,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          message = JSON.parse(text).error || text;
        } catch {
          /* not JSON, keep raw */
        }
        setError(message || `Request failed (${res.status}).`);
        setStreaming(false);
        return;
      }
      if (!res.body) {
        setError("Empty response from server.");
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) setMarkdown((m) => m + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setStreaming(false);
    }
  }, [upload, strategy]);

  return (
    <main className="mx-auto max-w-page px-5 sm:px-6 py-10 sm:py-14">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="font-extrabold tracking-tight text-3xl sm:text-4xl">
          <span className="text-text">ROCKET</span>{" "}
          <span className="text-accent">VISION</span>
        </h1>
        <p className="mt-2 text-muted text-sm sm:text-base">
          Drop your chart. Pick your strategy. Get a thesis in 30 seconds.
        </p>
      </header>

      <ChartUpload state={upload} onChange={setUpload} disabled={streaming} />

      <div className="mt-6">
        <StrategySelector
          value={strategy}
          onChange={setStrategy}
          disabled={streaming}
        />
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze}
        data-testid="analyze-button"
        className={[
          "mt-6 w-full rounded-xl px-5 py-3.5 font-semibold transition-colors",
          canAnalyze
            ? "bg-accent text-bg hover:brightness-110"
            : "bg-[#2A2A2D] text-muted cursor-not-allowed",
        ].join(" ")}
      >
        {streaming ? "Analyzing…" : "Analyze with Rocket Vision"}
      </button>

      <AnalysisReport markdown={markdown} streaming={streaming} error={error} />

      <Footer />
    </main>
  );
}
