"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionProps {
  /** HTML id for anchor / scroll navigation */
  id?: string;
  title: string;
  /** sub-title under title */
  subtitle?: string;
  /** small badge text (e.g. "必填") */
  badge?: string;
  /** initial open state */
  defaultOpen?: boolean;
  /** when set, hide entirely (e.g. pro-mode off + pro section) */
  hidden?: boolean;
  /** corner action (e.g. count, reset) */
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({
  id,
  title,
  subtitle,
  badge,
  defaultOpen = true,
  hidden = false,
  rightSlot,
  children,
}: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  if (hidden) return null;

  return (
    <section
      id={id}
      style={{ scrollMarginTop: "calc(var(--config-bar-height, 0px) + 3.5rem + 2.75rem + 8px)" }}
      className="rounded-2xl border border-border/60 bg-card/80 shadow-sm overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4",
          "text-left transition-colors hover:bg-accent/30",
        )}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            {badge && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary uppercase tracking-wider">
                {badge}
              </span>
            )}
            <h2 className="text-base font-semibold tracking-tight cn">{title}</h2>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground cn truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open ? "rotate-180" : "rotate-0",
            )}
          />
        </div>
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium cn">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground cn">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
