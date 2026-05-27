"use client";

import {
  AlertTriangle,
  BoxIcon,
  Download,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import * as React from "react";

import { Textarea } from "@/components/ui/textarea";
import { useErrorLog } from "@/lib/error-log-context";
import { useForm } from "@/lib/form-context";
import { editImage, generateImage, optimizePrompt, ratioToSize } from "@/lib/image-api";
import { useSettings } from "@/lib/settings-context";
import { assemble } from "@/lib/prompt-assembler";
import { vocab, findById } from "@/lib/vocab";
import { EditPromptBuilder } from "./EditPromptBuilder";
import { WhiteModelTab } from "./WhiteModelTab";

// ─── Studio tab definition ────────────────────────────────────────────────────

type StudioTab = "generate" | "edit" | "whitemodel";

const STUDIO_TABS: { id: StudioTab; label: string; Icon: React.ElementType }[] = [
  { id: "generate", label: "文生图", Icon: ImageIcon },
  { id: "edit", label: "改图", Icon: Pencil },
  { id: "whitemodel", label: "白膜赋材", Icon: BoxIcon },
];

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadImage(url: string, filename = "prompt-draw"): Promise<void> {
  if (url.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${Date.now()}.png`;
    a.click();
    return;
  }
  const res = await fetch(`/api/image/download?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`下载失败 ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${filename}-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ─── Empty result placeholder ────────────────────────────────────────────────

function EmptyResultState({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/30 bg-muted/10 min-h-[360px] p-10 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <ImageIcon className="size-10 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground cn">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground/60 cn">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ─── Shared result display ────────────────────────────────────────────────────

function ImageResult({
  url,
  revisedPrompt,
  onClear,
  filename = "prompt-draw",
}: {
  url: string;
  revisedPrompt?: string;
  onClear: () => void;
  filename?: string;
}) {
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadImage(url, filename);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold cn text-foreground/80">生成结果</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cn"
          >
            {downloading
              ? <><Loader2 className="size-3.5 animate-spin" />保存中…</>
              : <><Download className="size-3.5" />保存图片</>}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline cn"
          >
            新标签页 ↗
          </a>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            title="清除图片"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {downloadError && (
        <p className="text-xs text-red-600 dark:text-red-400 cn">⚠ {downloadError}</p>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="AI 生成图片"
        className="w-full rounded-2xl border border-border/40 object-cover shadow-sm"
      />

      {revisedPrompt && (
        <p className="text-xs text-muted-foreground cn leading-relaxed italic">
          模型重写：{revisedPrompt}
        </p>
      )}
    </div>
  );
}

// ─── Generate tab ─────────────────────────────────────────────────────────────

function GenerateTab({ onHasResult }: { onHasResult: (v: boolean) => void }) {
  const { state } = useForm();
  const { settings, isImageGenConfigured } = useSettings();
  const { log } = useErrorLog();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ url: string; revisedPrompt?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const template = findById(vocab.templates, state.template) ?? vocab.templates[0];
  const assembled = React.useMemo(
    () => (template ? assemble(state, template) : null),
    [state, template],
  );
  const size = ratioToSize(state.ratio);

  const [editedPrompt, setEditedPrompt] = React.useState(assembled?.prompt_en ?? "");
  const prevAssembled = React.useRef(assembled?.prompt_en ?? "");
  React.useEffect(() => {
    const next = assembled?.prompt_en ?? "";
    if (next !== prevAssembled.current) {
      setEditedPrompt(next);
      prevAssembled.current = next;
    }
  }, [assembled?.prompt_en]);

  React.useEffect(() => {
    onHasResult(result !== null);
  }, [result, onHasResult]);

  const handleGenerate = async () => {
    if (!isImageGenConfigured || !editedPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await generateImage(settings.imageGen, { prompt: editedPrompt.trim(), size });
      setResult(r);
      log("info", "生图", `生成成功，尺寸 ${size}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log("error", "生图", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Controls (left) ── */}
      <div className="lg:col-span-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cn">生图提示词</label>
            {assembled?.prompt_en && editedPrompt !== assembled.prompt_en && (
              <button
                type="button"
                onClick={() => setEditedPrompt(assembled.prompt_en)}
                className="text-xs text-muted-foreground hover:text-primary cn underline transition-colors"
              >
                还原表单生成
              </button>
            )}
          </div>
          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            placeholder="在提示词工坊填写表单，提示词将自动生成；也可在此直接编辑…"
            rows={7}
            className="resize-none text-sm font-mono cn leading-relaxed"
          />
          <p className="text-xs text-muted-foreground/60 font-mono">
            输出尺寸：{size}（依据提示词工坊画幅比例）
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={!isImageGenConfigured || !editedPrompt.trim() || loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cn shadow-sm"
        >
          {loading
            ? <><Loader2 className="size-4 animate-spin" />生成中…</>
            : <><ImageIcon className="size-4" />生成图片</>}
        </button>

        {!isImageGenConfigured && (
          <p className="text-center text-sm text-muted-foreground cn">
            请先在顶部配置栏填写生图 API Key
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 cn break-words">⚠ {error}</p>
        )}
      </div>

      {/* ── Result (right, sticky) ── */}
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-[calc(var(--config-bar-height,0px)+3.5rem+2rem)]">
          {result ? (
            <ImageResult
              url={result.url}
              revisedPrompt={result.revisedPrompt}
              onClear={() => setResult(null)}
              filename="prompt-draw"
            />
          ) : (
            <EmptyResultState
              label="图片将在此处显示"
              sublabel="填写提示词后点击「生成图片」"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit tab ─────────────────────────────────────────────────────────────────

interface UploadedImage {
  file: File;
  previewUrl: string;
}

function EditTab({ onHasResult }: { onHasResult: (v: boolean) => void }) {
  const { settings, isImageGenConfigured, isLLMConfigured } = useSettings();
  const { state } = useForm();
  const { log } = useErrorLog();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ url: string; revisedPrompt?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [editPrompt, setEditPrompt] = React.useState("");
  const [fidelity, setFidelity] = React.useState<"low" | "high">("high");
  const [optimizing, setOptimizing] = React.useState(false);
  const [optimizeError, setOptimizeError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const size = ratioToSize(state.ratio);

  React.useEffect(() => {
    onHasResult(result !== null);
  }, [result, onHasResult]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 4));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].previewUrl);
      next.splice(index, 1);
      return next;
    });
  };

  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptimize = async () => {
    if (!editPrompt.trim() || optimizing) return;
    setOptimizing(true);
    setOptimizeError(null);
    try {
      const refined = await optimizePrompt(settings.llm, editPrompt.trim());
      setEditPrompt(refined);
      log("info", "LLM润色（改图）", "润色成功");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOptimizeError(msg);
      log("error", "LLM润色（改图）", msg);
    } finally {
      setOptimizing(false);
    }
  };

  const handleEdit = async () => {
    if (!isImageGenConfigured || images.length === 0 || !editPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [primary, ...extras] = images;
      const r = await editImage(settings.imageGen, {
        image: primary.file,
        extraImages: extras.map((i) => i.file),
        prompt: editPrompt.trim(),
        size,
        inputFidelity: fidelity,
      });
      setResult(r);
      log("info", "改图", `改图成功，尺寸 ${size}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log("error", "改图", msg);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    isImageGenConfigured && images.length > 0 && editPrompt.trim().length > 0 && !loading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Controls (left) ── */}
      <div className="lg:col-span-5 space-y-5">
        {/* Image upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium cn">参考图片（最多 4 张）</label>
            <span className="text-xs text-muted-foreground cn">{images.length}/4</span>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative rounded-xl overflow-hidden border border-border/60 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={`参考图 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white cn font-medium">
                      主图
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 4 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-background/40 py-5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {images.length === 0 ? (
                <>
                  <Upload className="size-5" />
                  <span className="text-sm cn">点击上传图片（PNG / JPG）</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span className="text-sm cn">添加更多参考图</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* EditPromptBuilder */}
        <EditPromptBuilder
          onGenerate={(instruction) => {
            setEditPrompt(instruction);
            setOptimizeError(null);
          }}
        />

        {/* Edit prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium cn">改图指令</label>
            <button
              type="button"
              onClick={() => void handleOptimize()}
              disabled={!editPrompt.trim() || optimizing || !isLLMConfigured}
              title={!isLLMConfigured ? "请先在顶部配置 LLM API Key" : "翻译并优化改图指令"}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cn"
            >
              {optimizing ? (
                <><Loader2 className="size-3 animate-spin" />润色中…</>
              ) : (
                <><Wand2 className="size-3" />翻译 / 润色</>
              )}
            </button>
          </div>
          <Textarea
            value={editPrompt}
            onChange={(e) => {
              setEditPrompt(e.target.value);
              setOptimizeError(null);
            }}
            placeholder="用构建器生成，或直接输入改图指令（中英文均可）"
            rows={4}
            className="resize-none text-sm cn"
          />
          {optimizeError && (
            <p className="text-xs text-red-600 dark:text-red-400 cn">⚠ {optimizeError}</p>
          )}
        </div>

        {/* Fidelity */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground cn shrink-0">保留程度：</label>
          <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
            {(["high", "low"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFidelity(v)}
                className={`px-3 py-1.5 transition-colors cn ${
                  fidelity === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "high" ? "高保真" : "自由发挥"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground cn">
            {fidelity === "high" ? "尽量保留原图" : "允许大幅修改"}
          </p>
        </div>

        <p className="text-xs text-muted-foreground/60 font-mono">
          输出尺寸：{size}（依据提示词工坊画幅比例）
        </p>

        <button
          type="button"
          onClick={() => void handleEdit()}
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cn shadow-sm"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" />改图中…</>
          ) : (
            <><Pencil className="size-4" />开始改图</>
          )}
        </button>

        {!isImageGenConfigured && (
          <p className="text-center text-sm text-muted-foreground cn">
            请先在顶部配置栏填写生图 API Key
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 cn break-words">⚠ {error}</p>
        )}
      </div>

      {/* ── Result (right, sticky) ── */}
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-[calc(var(--config-bar-height,0px)+3.5rem+2rem)]">
          {result ? (
            <ImageResult
              url={result.url}
              revisedPrompt={result.revisedPrompt}
              onClear={() => setResult(null)}
              filename="edit"
            />
          ) : (
            <EmptyResultState
              label="改图结果将在此处显示"
              sublabel="上传参考图、填写改图指令后点击「开始改图」"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ImageStudioProps {
  onGoToPromptWorkshop?: () => void;
}

export function ImageStudio({ onGoToPromptWorkshop }: ImageStudioProps) {
  const [activeTab, setActiveTab] = React.useState<StudioTab>("generate");
  const generateHasResult = React.useRef(false);
  const editHasResult = React.useRef(false);
  const whiteModelHasResult = React.useRef(false);
  const [showSwitchWarning, setShowSwitchWarning] = React.useState(false);

  const handleTabChange = (value: StudioTab) => {
    let currentHasResult = false;
    if (activeTab === "generate") currentHasResult = generateHasResult.current;
    else if (activeTab === "edit") currentHasResult = editHasResult.current;
    else if (activeTab === "whitemodel") currentHasResult = whiteModelHasResult.current;
    setShowSwitchWarning(currentHasResult);
    setActiveTab(value);
  };

  return (
    <div className="space-y-0">
      {/* ── Studio-level tab navigation ── */}
      <div className="border-b border-border/60">
        <div className="flex gap-0">
          {STUDIO_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cn ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.Icon className="size-4 opacity-80" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab-switch warning ── */}
      {showSwitchWarning && (
        <div className="flex items-start gap-2.5 px-5 py-3 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/40">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 cn flex-1 leading-relaxed">
            切换标签后之前生成的图片已不可见。如需保留，请点击图片旁的
            <strong>「保存图片」</strong>按钮。
          </p>
          <button
            type="button"
            onClick={() => setShowSwitchWarning(false)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Tab content areas — CSS show/hide preserves local state ── */}
      <div className="pt-6">
        <div className={activeTab === "generate" ? "block" : "hidden"}>
          <GenerateTab onHasResult={(v) => { generateHasResult.current = v; }} />
        </div>
        <div className={activeTab === "edit" ? "block" : "hidden"}>
          <EditTab onHasResult={(v) => { editHasResult.current = v; }} />
        </div>
        <div className={activeTab === "whitemodel" ? "block" : "hidden"}>
          <WhiteModelTab
            onGoToPromptWorkshop={onGoToPromptWorkshop ?? (() => {})}
            onHasResult={(v) => { whiteModelHasResult.current = v; }}
          />
        </div>
      </div>
    </div>
  );
}
