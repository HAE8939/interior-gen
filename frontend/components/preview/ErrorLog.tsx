"use client";

import { Bug, Check, ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import * as React from "react";

import { useErrorLog, type LogLevel } from "@/lib/error-log-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(ts: Date): string {
  return `${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`;
}

const levelStyle: Record<LogLevel, string> = {
  error: "text-red-600 dark:text-red-400",
  warn:  "text-amber-600 dark:text-amber-400",
  info:  "text-muted-foreground",
};

const levelLabel: Record<LogLevel, string> = {
  error: "ERR",
  warn:  "WRN",
  info:  "INF",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ErrorLog() {
  const { entries, clear } = useErrorLog();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const errorCount = entries.filter((e) => e.level === "error").length;

  // Auto-open on first error
  React.useEffect(() => {
    if (errorCount > 0) setOpen(true);
  }, [errorCount]);

  // Auto-scroll to bottom when new entries arrive
  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries, open]);

  const handleCopy = async () => {
    const text = entries
      .map((e) => `[${formatTime(e.ts)}] [${levelLabel[e.level]}] [${e.source}] ${e.message}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "(日志为空)");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* unavailable */ }
  };

  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-card/60 shadow-sm overflow-hidden">
      {/* Header row — outer div to avoid nested-button violation */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-accent/30 transition-colors">
        {/* Left: toggle trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <Bug className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground cn">运行日志</span>
          {errorCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {errorCount}
            </span>
          )}
          {entries.length > 0 && errorCount === 0 && (
            <span className="text-[10px] text-muted-foreground/60">{entries.length} 条</span>
          )}
          <span className="ml-auto">
            {open
              ? <ChevronUp className="size-3.5 text-muted-foreground" />
              : <ChevronDown className="size-3.5 text-muted-foreground" />}
          </span>
        </button>

        {/* Right: copy + clear (siblings of toggle button, never children) */}
        {open && entries.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied
                ? <><Check className="size-2.5 text-primary" />已复制</>
                : <><Copy className="size-2.5" />复制</>}
            </button>
            <button
              type="button"
              onClick={() => clear()}
              className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="size-2.5" />清空
            </button>
          </div>
        )}
      </div>

      {/* Log list */}
      {open && (
        <div ref={listRef} className="border-t border-border/50 max-h-64 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="px-4 py-3 text-[11px] text-muted-foreground/60 italic cn">暂无日志</p>
          ) : (
            <div className="divide-y divide-border/30">
              {entries.map((entry) => (
                <div key={entry.id} className="flex gap-2 px-3 py-1.5 font-mono text-[10px] leading-snug">
                  <span className="text-muted-foreground/50 shrink-0">{formatTime(entry.ts)}</span>
                  <span className={`shrink-0 font-semibold ${levelStyle[entry.level]}`}>
                    {levelLabel[entry.level]}
                  </span>
                  <span className="text-primary/70 shrink-0">[{entry.source}]</span>
                  <span className={`break-all ${levelStyle[entry.level]}`}>{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
