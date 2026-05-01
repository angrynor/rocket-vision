"use client";

import { useCallback, useRef, useState } from "react";

export type UploadState =
  | { kind: "empty" }
  | { kind: "ready"; fileName: string; size: number; preview: string; dataUrl: string }
  | { kind: "error"; message: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

interface Props {
  state: UploadState;
  onChange: (s: UploadState) => void;
  disabled?: boolean;
}

export default function ChartUpload({ state, onChange, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ALLOWED.includes(file.type)) {
        onChange({
          kind: "error",
          message: "Use PNG, JPEG, WebP, or GIF.",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        onChange({
          kind: "error",
          message: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 10MB.`,
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = String(e.target?.result || "");
        onChange({
          kind: "ready",
          fileName: file.name,
          size: file.size,
          preview: dataUrl,
          dataUrl,
        });
      };
      reader.onerror = () =>
        onChange({ kind: "error", message: "Could not read file." });
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const reset = useCallback(() => onChange({ kind: "empty" }), [onChange]);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload chart screenshot"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        data-testid="chart-dropzone"
        className={[
          "relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-colors cursor-pointer",
          "px-6 py-10 min-h-[250px]",
          dragOver
            ? "border-accent bg-surface/80"
            : "border-[#2A2A2D] bg-surface hover:border-accent/60",
          disabled ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={onPick}
          data-testid="chart-input"
        />

        {state.kind === "empty" && (
          <div className="text-center">
            <UploadIcon className="mx-auto mb-3 text-accent" />
            <p className="text-text font-medium">
              Drop your chart here, or click to upload
            </p>
            <p className="text-muted text-sm mt-1">
              PNG, JPG, WebP — up to 10MB
            </p>
          </div>
        )}

        {state.kind === "ready" && (
          <div className="flex flex-col items-center w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.preview}
              alt="Chart preview"
              className="max-h-56 w-auto rounded-lg border border-[#2A2A2D]"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="font-mono text-sm text-muted truncate max-w-[280px]">
                {state.fileName}
              </span>
              <span className="font-mono text-xs text-muted">
                {(state.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                className="text-xs text-muted hover:text-bear"
                aria-label="Remove chart"
              >
                remove
              </button>
            </div>
          </div>
        )}

        {state.kind === "error" && (
          <div className="text-center">
            <p className="text-bear font-medium">{state.message}</p>
            <p className="text-muted text-sm mt-1">Click to try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M5 11l7-7 7 7" />
      <path d="M5 20h14" />
    </svg>
  );
}
