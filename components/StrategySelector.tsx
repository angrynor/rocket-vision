"use client";

import { STRATEGIES } from "@/lib/strategies";
import { STRATEGY_IDS, type StrategyId } from "@/lib/types";

interface Props {
  value: StrategyId;
  onChange: (s: StrategyId) => void;
  disabled?: boolean;
}

export default function StrategySelector({ value, onChange, disabled }: Props) {
  return (
    <fieldset
      className="w-full"
      aria-label="Strategy lens"
      data-testid="strategy-selector"
    >
      <legend className="text-sm uppercase tracking-wider text-muted mb-2">
        Strategy lens
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {STRATEGY_IDS.map((id) => {
          const s = STRATEGIES[id];
          const checked = value === id;
          return (
            <label
              key={id}
              className={[
                "flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors border",
                checked
                  ? "border-accent bg-accent/10"
                  : "border-[#2A2A2D] bg-surface hover:border-accent/60",
                disabled ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name="strategy"
                value={id}
                checked={checked}
                onChange={() => onChange(id)}
                className="mt-1 accent-[#00E0FF]"
                disabled={disabled}
                data-testid={`strategy-radio-${id}`}
              />
              <div className="flex-1">
                <div className="font-medium text-text">
                  {s.name}
                  {id === "auto" && (
                    <span className="ml-2 text-xs text-accent uppercase tracking-wider">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted mt-0.5">{s.blurb}</div>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
