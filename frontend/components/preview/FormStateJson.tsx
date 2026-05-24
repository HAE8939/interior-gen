"use client";

import { Check, ChevronDown, ChevronUp, Code2, Copy } from "lucide-react";
import * as React from "react";

import { useForm } from "@/lib/form-context";

export function FormStateJson() {
  const { state } = useForm();
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const json = React.useMemo(() => JSON.stringify(state, null, 2), [state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-card/60 shadow-sm overflow-hidden">
      {/* Header row — outer div, not button, to avoid nested-button violation */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-accent/30 transition-colors">
        {/* Left: toggle trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <Code2 className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] font-medium text-muted-foreground cn">开发者工具 · 表单状态 JSON</span>
          <span className="ml-auto">
            {open
              ? <ChevronUp className="size-3.5 text-muted-foreground" />
              : <ChevronDown className="size-3.5 text-muted-foreground" />}
          </span>
        </button>
        {/* Right: copy button (sibling, not child of toggle button) */}
        {open && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <><Check className="size-2.5 text-primary" />已复制</> : <><Copy className="size-2.5" />复制</>}
          </button>
        )}
      </div>

      {/* Collapsible body */}
      {open && (
        <pre className="scrollbar-thin max-h-72 overflow-auto border-t border-border/50 px-4 py-3 text-[11px] leading-relaxed font-mono text-foreground/80">
          {highlightJson(json)}
        </pre>
      )}
    </div>
  );
}

/**
 * Lightweight JSON syntax highlighter.
 */
function highlightJson(json: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)?|(\b-?\d+(?:\.\d+)?\b)|\b(true|false)\b|\b(null)\b|([{}[\],])/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(json)) !== null) {
    if (m.index > lastIndex) tokens.push(json.slice(lastIndex, m.index));
    if (m[1] && m[2]) {
      tokens.push(<span key={key++} className="text-primary">{m[1]}</span>, m[2]);
    } else if (m[1]) {
      tokens.push(<span key={key++} className="text-emerald-700 dark:text-emerald-300">{m[1]}</span>);
    } else if (m[3]) {
      tokens.push(<span key={key++} className="text-amber-700 dark:text-amber-300">{m[3]}</span>);
    } else if (m[4]) {
      tokens.push(<span key={key++} className="text-blue-700 dark:text-blue-300">{m[4]}</span>);
    } else if (m[5]) {
      tokens.push(<span key={key++} className="text-muted-foreground italic">{m[5]}</span>);
    } else if (m[6]) {
      tokens.push(<span key={key++} className="text-muted-foreground">{m[6]}</span>);
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < json.length) tokens.push(json.slice(lastIndex));
  return tokens;
}
