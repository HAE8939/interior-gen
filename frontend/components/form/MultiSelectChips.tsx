"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChipOption {
  id: string;
  name_zh: string;
  name_en: string;
}

interface MultiSelectChipsProps<T extends ChipOption> {
  options: readonly T[];
  value: readonly string[];
  onToggle: (id: string) => void;
  /** soft cap on selection count (will not block, just hint) */
  max?: number;
  min?: number;
  /** show the english name on hover */
  showEnOnHover?: boolean;
}

export function MultiSelectChips<T extends ChipOption>({
  options,
  value,
  onToggle,
  max,
  min,
  showEnOnHover = true,
}: MultiSelectChipsProps<T>) {
  const selectedSet = new Set(value);
  const count = value.length;
  const hint =
    max && min
      ? `已选 ${count} · 建议 ${min}–${max}`
      : max
      ? `已选 ${count} / ${max}`
      : `已选 ${count}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const selected = selectedSet.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              title={showEnOnHover ? opt.name_en : undefined}
              className={cn(
                "group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-all",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card text-foreground/80 hover:border-primary/40 hover:text-foreground",
              )}
            >
              <span className="cn">{opt.name_zh}</span>
              {selected && (
                <X className="size-3 opacity-70 group-hover:opacity-100" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground cn">{hint}</p>
    </div>
  );
}
