"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CardOption {
  id: string;
  name_zh: string;
  name_en: string;
  description_zh?: string;
  tags?: readonly string[];
}

interface SingleSelectCardsProps<T extends CardOption> {
  options: readonly T[];
  value: string;
  onChange: (id: string) => void;
  /** how many columns at lg */
  cols?: 2 | 3 | 4;
  /** show description under each card */
  showDescription?: boolean;
  /** render a custom adornment (e.g. gradient preview) above the title */
  renderAdornment?: (option: T) => React.ReactNode;
}

export function SingleSelectCards<T extends CardOption>({
  options,
  value,
  onChange,
  cols = 3,
  showDescription = true,
  renderAdornment,
}: SingleSelectCardsProps<T>) {
  const colsClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  }[cols];

  return (
    <div className={cn("grid gap-2.5", colsClass)}>
      {options.map((opt) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "group relative text-left rounded-xl border bg-card p-3 transition-all",
              "hover:border-primary/40 hover:shadow-sm",
              selected
                ? "border-primary border-[1.5px] bg-primary/[0.04] shadow-sm"
                : "border-border/70",
            )}
          >
            {selected && (
              <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            {renderAdornment?.(opt)}
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium cn truncate">{opt.name_zh}</span>
              </div>
              <div className="text-[11px] text-muted-foreground/80 font-mono truncate">
                {opt.name_en}
              </div>
              {showDescription && opt.description_zh && (
                <p className="text-[11px] text-muted-foreground/90 cn line-clamp-2 pt-0.5">
                  {opt.description_zh}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
