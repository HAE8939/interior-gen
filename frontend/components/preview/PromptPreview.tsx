"use client";

import { AlertTriangle, Check, Copy, Loader2, Sparkles, Wand2 } from "lucide-react";
import * as React from "react";

import { useForm } from "@/lib/form-context";
import { useErrorLog } from "@/lib/error-log-context";
import { optimizePrompt } from "@/lib/image-api";
import { assemble } from "@/lib/prompt-assembler";
import { useSettings } from "@/lib/settings-context";
import type { FormState } from "@/lib/types";
import { vocab, findById } from "@/lib/vocab";

// ─── Progress indicator ────────────────────────────────────────────────────────

const REQUIRED_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "space", label: "空间类型" },
  { key: "style", label: "设计风格" },
  { key: "lighting", label: "光影氛围" },
  { key: "ratio", label: "画幅比例" },
];

const RECOMMENDED_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "season", label: "季节" },
  { key: "weather", label: "天气" },
  { key: "materials", label: "材质" },
  { key: "furniture", label: "家具" },
  { key: "colors", label: "配色" },
];

function isFieldFilled(state: FormState, key: keyof FormState): boolean {
  const v = state[key];
  if (v === null || v === undefined || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function FormProgress({ state }: { state: FormState }) {
  const reqFilled = REQUIRED_FIELDS.filter((f) => isFieldFilled(state, f.key));
  const recFilled = RECOMMENDED_FIELDS.filter((f) => isFieldFilled(state, f.key));
  const reqPct = (reqFilled.length / REQUIRED_FIELDS.length) * 100;
  const missingReq = REQUIRED_FIELDS.filter((f) => !isFieldFilled(state, f.key));

  return (
    <div className="space-y-1.5 px-4 py-3 bg-background/40 border-b border-border/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium cn">必填 {reqFilled.length}/{REQUIRED_FIELDS.length}</span>
          <span className="text-[11px] text-muted-foreground cn">· 推荐 {recFilled.length}/{RECOMMENDED_FIELDS.length}</span>
        </div>
        {reqFilled.length === REQUIRED_FIELDS.length ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium cn">
            <Check className="size-3" />可生图
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground cn">
            缺：{missingReq.map((f) => f.label).join("、")}
          </span>
        )}
      </div>
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${reqPct}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type SectionKey = "prompt_en" | "negative";

export function PromptPreview() {
  const { state } = useForm();
  const { settings, isLLMConfigured } = useSettings();
  const { log } = useErrorLog();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeError, setOptimizeError] = React.useState<string | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = React.useState<string | null>(null);

  const template = React.useMemo(
    () => findById(vocab.templates, state.template) ?? vocab.templates[0],
    [state.template],
  );

  const result = React.useMemo(() => {
    if (!template) return { prompt_en: "", mj_suffix: "", negative_prompt: "", template_id: "", notes: ["未选择模板"] };
    return assemble(state, template);
  }, [state, template]);

  // Clear optimized when assembled prompt changes
  React.useEffect(() => {
    setOptimizedPrompt(null);
    setOptimizeError(null);
  }, [result.prompt_en]);

  const ratio = findById(vocab.composition.ratios, state.ratio);

  const displayPrompt = optimizedPrompt ?? result.prompt_en;

  const sections: Array<{ key: SectionKey; label_zh: string; label_en: string; text: string; emptyHint?: string }> = [
    { key: "prompt_en", label_zh: "主提示词", label_en: "prompt_en", text: displayPrompt },
    { key: "negative", label_zh: "负向词", label_en: "negative_prompt", text: result.negative_prompt, emptyHint: "未选择负向词预设" },
  ];

  const copy = async (key: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch { /* unavailable */ }
  };

  const handleOptimize = async () => {
    if (!result.prompt_en || optimizing) return;
    setOptimizing(true);
    setOptimizeError(null);
    try {
      const refined = await optimizePrompt(settings.llm, optimizedPrompt ?? result.prompt_en);
      setOptimizedPrompt(refined);
      log("info", "LLM润色（预览）", "润色成功");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOptimizeError(msg);
      log("error", "LLM润色（预览）", msg);
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-semibold tracking-tight cn flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            原始 Prompt 预览
          </h3>
          <p className="text-[11px] text-muted-foreground cn">
            模板：<span className="font-mono text-foreground/80 mx-1">{template?.id ?? "—"}</span>
            {template?.name_zh && <span className="cn text-foreground/60">· {template.name_zh}</span>}
            {ratio?.mj_param && <span className="text-foreground/60 ml-2 font-mono">· --ar {ratio.mj_param}</span>}
          </p>
        </div>
        {/* LLM optimize button */}
        <button
          type="button"
          onClick={() => void handleOptimize()}
          disabled={!result.prompt_en || optimizing || !isLLMConfigured}
          title={!isLLMConfigured ? "请先在顶部配置 LLM API Key" : "使用 LLM 润色优化 Prompt"}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {optimizing
            ? <><Loader2 className="size-3.5 animate-spin" />润色中…</>
            : <><Wand2 className="size-3.5" />一键润色</>}
        </button>
      </div>

      {/* Progress */}
      <FormProgress state={state} />

      {/* Optimized indicator */}
      {optimizedPrompt && (
        <div className="px-4 py-1.5 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-200/40 dark:border-emerald-800/30 flex items-center justify-between gap-2">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 cn flex items-center gap-1">
            <Wand2 className="size-3" />已经过 LLM 润色
          </span>
          <button
            type="button"
            onClick={() => { setOptimizedPrompt(null); setOptimizeError(null); }}
            className="text-[10px] text-muted-foreground hover:text-foreground cn underline"
          >
            还原原始
          </button>
        </div>
      )}

      {/* LLM error */}
      {optimizeError && (
        <div className="px-4 py-2 bg-red-50/60 dark:bg-red-950/20 border-b border-red-200/40 dark:border-red-800/30">
          <p className="text-[10px] text-red-700 dark:text-red-400 cn">⚠ {optimizeError}</p>
        </div>
      )}

      {/* Prompt sections */}
      <div className="divide-y divide-border/50">
        {sections.map((section) => {
          const isEmpty = !section.text;
          const isCopied = copiedKey === section.key;
          return (
            <div key={section.key} className="px-4 py-3 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-xs font-semibold cn">{section.label_zh}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{section.label_en}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copy(section.key, section.text)}
                  disabled={isEmpty}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isCopied
                    ? <><Check className="size-3 text-primary" />已复制</>
                    : <><Copy className="size-3" />复制</>}
                </button>
              </div>
              {isEmpty ? (
                <p className="text-[11px] text-muted-foreground/70 italic cn">{section.emptyHint ?? "（空）"}</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[12px] leading-relaxed font-mono text-foreground/90">
                  {section.text}
                </pre>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {result.notes.length > 0 && (
        <div className="border-t border-border/60 bg-amber-50/40 dark:bg-amber-950/20 px-4 py-2.5 space-y-1">
          {result.notes.map((note, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200 cn">
              <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
              <p>{note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
