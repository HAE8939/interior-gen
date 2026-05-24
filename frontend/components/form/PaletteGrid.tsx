"use client";

import { Check } from "lucide-react";

import type { PaletteItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PaletteGridProps {
  options: readonly PaletteItem[];
  value: readonly string[];
  onToggle: (id: string) => void;
  max?: number;
}

export function PaletteGrid({ options, value, onToggle, max = 2 }: PaletteGridProps) {
  const selectedSet = new Set(value);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const selected = selectedSet.has(opt.id);
          const swatches = opt.palette ?? [];
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={cn(
                "group relative text-left rounded-xl border bg-card p-2.5 transition-all",
                "hover:border-primary/40 hover:shadow-sm",
                selected
                  ? "border-primary border-[1.5px] bg-primary/[0.04]"
                  : "border-border/70",
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
              <div className="flex gap-1 mb-2 h-10 rounded-md overflow-hidden border border-border/40">
                {swatches.length > 0 ? (
                  swatches.map((hex, i) => (
                    <span
                      key={`${hex}-${i}`}
                      style={{ background: hex }}
                      className="flex-1 first:rounded-l-md last:rounded-r-md"
                    />
                  ))
                ) : (
                  <span className="flex-1 bg-muted" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-medium cn truncate">{opt.name_zh}</div>
                <div className="text-[11px] text-muted-foreground/80 font-mono truncate">
                  {opt.name_en}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground cn">
        已选 {value.length}（建议 1–{max}）
      </p>
    </div>
  );
}
