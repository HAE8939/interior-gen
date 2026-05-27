"use client";

import { Check, Eye, EyeOff, FileJson, Loader2, X } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

// ─── Logo SVG (从 logo.svg 提取路径，fill 设为 currentColor) ──────────────────

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 99.59 93.24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <polygon points="49.43 33.08 53.19 17.27 18.05 17.27 0 93.24 5.79 93.24 22.58 22.54 46.15 22.54 43.64 33.08 31.47 33.08 30.76 38.36 42.39 38.36 34.67 70.85 40.46 70.85 48.18 38.36 71.07 38.36 58.04 93.24 63.83 93.24 78.12 33.08 49.43 33.08" />
      <polygon points="22.87 0 21.65 5.28 92.54 5.28 76.97 70.85 82.76 70.85 99.59 0 22.87 0" />
    </svg>
  );
}

// ─── Status pill ────────────────────────────────────────────────────────────

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
      ok
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    )}>
      {ok
        ? <Check className="size-2.5" />
        : <span className="size-2 rounded-full bg-amber-500 shrink-0" />}
      {label}
    </span>
  );
}

// ─── API Key input ────────────────────────────────────────────────────────────

function ApiKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入 API 密钥…"
        className="pr-8 h-8 text-xs font-mono"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function ConfigBar() {
  const {
    settings,
    updateLLM,
    updateImageGen,
    save,
    isLLMConfigured,
    isImageGenConfigured,
  } = useSettings();

  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await save();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // 点击背景遮罩关闭面板
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  return (
    <>
      {/* ── 遮罩（点击任意处关闭） ── */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleBackdropClick}
          aria-hidden
        />
      )}

      {/* ── 设置面板 ── */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl"
          role="dialog"
          aria-label="系统设置"
        >
          {/* 面板头部 */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40">
            <div>
              <h2 className="text-sm font-semibold cn">系统设置</h2>
              <p className="text-xs text-muted-foreground cn mt-0.5">配置接口密钥与模型参数</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill ok={isLLMConfigured} label={isLLMConfigured ? "LLM 已配置" : "LLM 未配置"} />
              <StatusPill ok={isImageGenConfigured} label={isImageGenConfigured ? "生图 已配置" : "生图 未配置"} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-1 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="关闭"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 面板主体 */}
          <div className="px-5 py-4 space-y-4">

            {/* LLM */}
            <div className="space-y-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
              <div>
                <p className="text-xs font-semibold cn">LLM 翻译 / 润色</p>
                <p className="text-[10px] text-muted-foreground cn mt-0.5">中文自由输入翻译 + Prompt 润色</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] cn">API 密钥</Label>
                <ApiKeyInput value={settings.llm.apiKey} onChange={(v) => updateLLM({ apiKey: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] cn">接口地址</Label>
                  <Input
                    value={settings.llm.baseUrl}
                    onChange={(e) => updateLLM({ baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] cn">模型</Label>
                  <Input
                    value={settings.llm.model}
                    onChange={(e) => updateLLM({ model: e.target.value })}
                    placeholder="deepseek-chat"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 生图 */}
            <div className="space-y-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
              <div>
                <p className="text-xs font-semibold cn">生图 / 改图接口</p>
                <p className="text-[10px] text-muted-foreground cn mt-0.5">支持 GPT-image、Nano banana 等 OpenAI 兼容接口</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] cn">API 密钥</Label>
                <ApiKeyInput value={settings.imageGen.apiKey} onChange={(v) => updateImageGen({ apiKey: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] cn">接口地址</Label>
                  <Input
                    value={settings.imageGen.baseUrl}
                    onChange={(e) => updateImageGen({ baseUrl: e.target.value })}
                    placeholder="https://api.example.com"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] cn">模型</Label>
                  <Input
                    value={settings.imageGen.model}
                    onChange={(e) => updateImageGen({ model: e.target.value })}
                    placeholder="gpt-image-2"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 保存区 */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground cn flex items-center gap-1">
                <FileJson className="size-3 shrink-0" />
                密钥保存于本地 api-config.json，已加入 .gitignore
              </p>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {saveError && (
                  <p className="text-[10px] text-red-600 dark:text-red-400 max-w-[200px] text-right">
                    ⚠ {saveError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <><Loader2 className="size-3.5 animate-spin" />保存中…</>
                  ) : saved ? (
                    <><Check className="size-3.5" />已保存</>
                  ) : (
                    <><Check className="size-3.5" />保存配置</>
                  )}
                </button>
              </div>
            </div>

            {/* 联系作者 */}
            <div className="border-t border-border/40 pt-3">
              <p className="text-[11px] text-muted-foreground cn">
                联系作者：<span className="font-medium text-foreground">HAE893922</span>（微信号）
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ── 右下角悬浮按钮 ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="打开系统设置"
        aria-expanded={open}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "flex items-center justify-center",
          "w-12 h-12 rounded-full",
          "bg-black text-white",
          "shadow-lg hover:shadow-xl",
          "hover:scale-105 active:scale-95",
          "transition-all duration-200",
          open && "scale-95 shadow-inner",
        )}
      >
        {/* 未配置时右上角显示小红点提示 */}
        {(!isLLMConfigured || !isImageGenConfigured) && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
        )}
        <LogoIcon className="w-6 h-6" />
      </button>
    </>
  );
}
