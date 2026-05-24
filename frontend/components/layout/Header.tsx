"use client";

import { Sparkles, Wrench } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "@/lib/form-context";
import { vocabMeta } from "@/lib/vocab";

export function Header() {
  const { proMode, setProMode, reset } = useForm();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
      {/* ── Left: title ── */}
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Sparkles className="size-4" />
          </span>
          <h1 className="text-lg font-semibold tracking-tight cn leading-tight">
            室内设计 AI 提示词生成器
          </h1>
        </div>
        <p className="text-[11px] text-muted-foreground cn pl-9">
          Interior Design Prompt Studio ·{" "}
          <span className="font-mono">vocab v{vocabMeta.version}</span>
          {vocabMeta.totals && "total_items_approx" in vocabMeta.totals && (
            <> · {String((vocabMeta.totals as { total_items_approx?: number }).total_items_approx ?? "")} 词条</>
          )}
        </p>
      </div>

      {/* ── Right: pro mode + reset ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Pro mode toggle */}
        <label className="flex items-center gap-2 cursor-pointer" htmlFor="header-pro-mode">
          <Switch
            id="header-pro-mode"
            checked={proMode}
            onCheckedChange={setProMode}
            className="scale-90"
          />
          <div className="hidden sm:flex items-center gap-1.5">
            <Wrench className="size-3.5 text-muted-foreground" />
            <Label htmlFor="header-pro-mode" className="text-xs cn cursor-pointer font-medium">
              专业模式
            </Label>
          </div>
        </label>

        {/* Reset */}
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cn"
        >
          重置
        </button>
      </div>
    </header>
  );
}
