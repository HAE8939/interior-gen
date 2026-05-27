"use client";

/**
 * EditPromptBuilder
 * ─────────────────
 * Structured chip-based prompt builder for image editing (改图) instructions.
 * Users pick an edit target (what to change) + an edit action (how to change)
 * and optionally type a supplementary description. Clicking "生成改图指令"
 * assembles a coherent English instruction string and returns it to the parent.
 */

import { Wand2 } from "lucide-react";
import * as React from "react";
import { vocab } from "@/lib/vocab";

interface EditPromptBuilderProps {
  /** Called when user clicks "生成改图指令" with the assembled English string */
  onGenerate: (instruction: string) => void;
}

export function EditPromptBuilder({ onGenerate }: EditPromptBuilderProps) {
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);
  const [supplement, setSupplement] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const targets = vocab.editInstructions.targets;
  const actions = vocab.editInstructions.actions;

  const targetObj = targets.find((t) => t.id === selectedTarget);
  const actionObj = actions.find((a) => a.id === selectedAction);

  function buildInstruction(): string {
    if (!actionObj) return supplement.trim();

    const targetName = targetObj ? targetObj.name_en : "";
    let base = actionObj.template_en.replace("{target}", targetName).replace("{target}", targetName);

    // Clean up stray "the  " if no target selected
    base = base.replace(/\bthe\s{2,}/g, "the ").trim();

    // Append supplement
    const parts = [base];
    if (supplement.trim()) parts.push(supplement.trim());

    return parts.join(" ").replace(/\s+/g, " ").trim();
  }

  function handleGenerate() {
    const instruction = buildInstruction();
    if (!instruction) return;
    onGenerate(instruction);
    // Optionally collapse after generating
    setOpen(false);
  }

  const canGenerate = (selectedAction !== null) || supplement.trim().length > 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-2 text-[11px] text-primary hover:bg-primary/10 transition-colors cn"
      >
        <Wand2 className="size-3.5" />
        使用改图指令构建器快速生成指令
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-primary cn flex items-center gap-1.5">
          <Wand2 className="size-3.5" />
          改图指令构建器
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-muted-foreground hover:text-foreground cn"
        >
          收起
        </button>
      </div>

      {/* Step 1: Edit target */}
      <div>
        <p className="text-[10px] text-muted-foreground cn mb-1.5">① 改动对象（可不选）</p>
        <div className="flex flex-wrap gap-1.5">
          {targets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTarget(selectedTarget === t.id ? null : t.id)}
              title={t.description_zh}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors cn ${
                selectedTarget === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t.name_zh}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Edit action */}
      <div>
        <p className="text-[10px] text-muted-foreground cn mb-1.5">② 改动方式</p>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAction(selectedAction === a.id ? null : a.id)}
              title={a.hint_zh}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors cn ${
                selectedAction === a.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {a.name_zh}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Supplement */}
      <div>
        <p className="text-[10px] text-muted-foreground cn mb-1">③ 补充说明（目标效果，中/英文均可）</p>
        <input
          type="text"
          value={supplement}
          onChange={(e) => setSupplement(e.target.value)}
          placeholder={
            selectedAction
              ? `${actionObj?.hint_zh ?? "填写具体目标，如：oak wood, warm beige…"}`
              : "填写具体改动内容，如：warm oak floor, white walls…"
          }
          className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-[11px] placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none cn"
        />
      </div>

      {/* Preview */}
      {(selectedAction || supplement.trim()) && (
        <div className="rounded-lg border border-border/40 bg-card/60 px-2.5 py-2">
          <p className="text-[10px] text-muted-foreground cn mb-0.5">预览：</p>
          <p className="text-[11px] font-mono text-foreground/80 leading-relaxed">
            {buildInstruction()}
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cn"
      >
        <Wand2 className="size-3.5" />
        填入改图指令框
      </button>
    </div>
  );
}
