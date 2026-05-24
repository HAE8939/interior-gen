"use client";

import { AlertTriangle, Download, ImageIcon, Loader2, Pencil, Plus, Upload, Wand2, X } from "lucide-react";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useErrorLog } from "@/lib/error-log-context";
import { useForm } from "@/lib/form-context";
import { editImage, generateImage, optimizePrompt, ratioToSize } from "@/lib/image-api";
import { useSettings } from "@/lib/settings-context";
import { assemble } from "@/lib/prompt-assembler";
import { vocab, findById } from "@/lib/vocab";

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<void> {
  if (url.startsWith("data:")) {
    // Base64 — direct download
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-draw-${Date.now()}.png`;
    a.click();
    return;
  }
  // Remote URL — proxy through our server to bypass CORS + force attachment header
  const res = await fetch(`/api/image/download?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`下载失败 ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `prompt-draw-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ─── Shared result display ────────────────────────────────────────────────────

function ImageResult({
  url,
  revisedPrompt,
  onClear,
  onSaved,
}: {
  url: string;
  revisedPrompt?: string;
  onClear: () => void;
  /** Called after a successful save so parent can clear the "unsaved" flag */
  onSaved: () => void;
}) {
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadImage(url);
      onSaved();
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium cn">生成结果</span>
        <div className="flex items-center gap-2">
          {/* Save / download button */}
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cn"
          >
            {downloading
              ? <><Loader2 className="size-3 animate-spin" />保存中…</>
              : <><Download className="size-3" />保存图片</>}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-primary hover:underline cn"
          >
            新标签页 ↗
          </a>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="清除图片"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {downloadError && (
        <p className="text-[10px] text-red-600 dark:text-red-400 cn">⚠ {downloadError}</p>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="AI 生成图片"
        className="w-full rounded-xl border border-border/50 object-cover"
      />
      {revisedPrompt && (
        <p className="text-[10px] text-muted-foreground cn leading-relaxed italic">
          模型重写 Prompt：{revisedPrompt}
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

  // Notify parent when result changes
  React.useEffect(() => { onHasResult(result !== null); }, [result, onHasResult]);

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
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-medium cn">生图提示词</p>
          {assembled?.prompt_en && editedPrompt !== assembled.prompt_en && (
            <button
              type="button"
              onClick={() => setEditedPrompt(assembled.prompt_en)}
              className="text-[10px] text-muted-foreground hover:text-foreground cn underline"
            >
              还原表单生成
            </button>
          )}
        </div>
        <Textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          placeholder="填写左侧表单自动生成，也可在此直接编辑…"
          rows={4}
          className="resize-none text-xs font-mono cn"
        />
        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">尺寸：{size}（根据左侧画幅比例自动设定）</p>
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={!isImageGenConfigured || !editedPrompt.trim() || loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cn"
      >
        {loading
          ? <><Loader2 className="size-4 animate-spin" />生成中…</>
          : <><ImageIcon className="size-4" />生成图片</>}
      </button>

      {!isImageGenConfigured && (
        <p className="text-center text-[11px] text-muted-foreground cn">
          请先在顶部配置栏填写生图 API Key
        </p>
      )}
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 cn break-words">⚠ {error}</p>}
      {result && (
        <ImageResult
          url={result.url}
          revisedPrompt={result.revisedPrompt}
          onClear={() => setResult(null)}
          onSaved={() => {/* saved flag cleared automatically when result persists */}}
        />
      )}
    </div>
  );
}

// ─── Edit tab ─────────────────────────────────────────────────────────────────

interface UploadedImage { file: File; previewUrl: string; }

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

  // Notify parent when result changes
  React.useEffect(() => { onHasResult(result !== null); }, [result, onHasResult]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newImages: UploadedImage[] = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
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
    return () => { images.forEach((img) => URL.revokeObjectURL(img.previewUrl)); };
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

  const canSubmit = isImageGenConfigured && images.length > 0 && editPrompt.trim().length > 0 && !loading;

  return (
    <div className="space-y-3">
      {/* Image upload */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-medium cn">上传图片（最多 4 张）</p>
          <span className="text-[10px] text-muted-foreground cn">{images.length}/4</span>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {images.map((img, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-border/60 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={`参考图 ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white cn">主图</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < 4 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-background/40 py-4 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {images.length === 0
              ? <><Upload className="size-5" /><span className="text-[11px] cn">点击上传图片（PNG / JPG）</span></>
              : <><Plus className="size-4" /><span className="text-[11px] cn">添加更多参考图</span></>}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {/* Edit prompt + LLM */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-medium cn">改图指令</p>
          <button
            type="button"
            onClick={() => void handleOptimize()}
            disabled={!editPrompt.trim() || optimizing || !isLLMConfigured}
            title={!isLLMConfigured ? "请先在顶部配置 LLM API Key" : "翻译并优化改图指令"}
            className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cn"
          >
            {optimizing ? <><Loader2 className="size-3 animate-spin" />润色中…</> : <><Wand2 className="size-3" />翻译 / 润色</>}
          </button>
        </div>
        <Textarea
          value={editPrompt}
          onChange={(e) => { setEditPrompt(e.target.value); setOptimizeError(null); }}
          placeholder="描述你想怎么修改图片，中文或英文均可；LLM 润色后英文效果更佳"
          rows={3}
          className="resize-none text-xs cn"
        />
        {optimizeError && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1 cn">⚠ {optimizeError}</p>}
      </div>

      {/* Fidelity */}
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-muted-foreground cn shrink-0">保留程度：</p>
        <div className="flex rounded-lg border border-border/60 overflow-hidden text-[11px]">
          {(["high", "low"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setFidelity(v)}
              className={`px-3 py-1 transition-colors cn ${fidelity === v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {v === "high" ? "高保真" : "自由发挥"}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground cn">{fidelity === "high" ? "尽量保留原图细节" : "允许较大幅度修改"}</p>
      </div>

      <p className="text-[10px] text-muted-foreground/70 font-mono">输出尺寸：{size}（根据左侧画幅比例自动设定）</p>

      <button
        type="button"
        onClick={() => void handleEdit()}
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cn"
      >
        {loading ? <><Loader2 className="size-4 animate-spin" />改图中…</> : <><Pencil className="size-4" />开始改图</>}
      </button>

      {!isImageGenConfigured && (
        <p className="text-center text-[11px] text-muted-foreground cn">请先在顶部配置栏填写生图 API Key</p>
      )}
      {error && <p className="text-[11px] text-red-600 dark:text-red-400 cn break-words">⚠ {error}</p>}
      {result && (
        <ImageResult
          url={result.url}
          revisedPrompt={result.revisedPrompt}
          onClear={() => setResult(null)}
          onSaved={() => {/* no-op: image persists until cleared */}}
        />
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ImageStudio() {
  const [activeTab, setActiveTab] = React.useState("generate");
  // Track whether each tab has an unsaved (un-downloaded) result
  const generateHasResult = React.useRef(false);
  const editHasResult = React.useRef(false);
  const [showSwitchWarning, setShowSwitchWarning] = React.useState(false);

  const handleTabChange = (value: string) => {
    const leavingTab = activeTab;
    const currentHasResult =
      leavingTab === "generate" ? generateHasResult.current : editHasResult.current;
    setShowSwitchWarning(currentHasResult);
    setActiveTab(value);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60">
        <h3 className="text-sm font-semibold tracking-tight cn flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-primary" />
          图片工作台
        </h3>
        <p className="text-[11px] text-muted-foreground cn mt-0.5">
          生图使用表单拼装的 Prompt（可自由编辑）· 改图上传原图后输入修改指令
        </p>
      </div>

      {/* Tab-switch warning banner */}
      {showSwitchWarning && (
        <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/40">
          <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 cn flex-1 leading-relaxed">
            切换标签页后，之前生成的图片已不可见。如需保留，请点击图片旁的<strong>「保存图片」</strong>按钮。
          </p>
          <button
            type="button"
            onClick={() => setShowSwitchWarning(false)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="generate" className="flex-1 cn">
              <ImageIcon className="size-3.5 mr-1.5" />生图
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex-1 cn">
              <Pencil className="size-3.5 mr-1.5" />改图
            </TabsTrigger>
          </TabsList>
          <TabsContent value="generate" className="mt-0">
            <GenerateTab onHasResult={(v) => { generateHasResult.current = v; }} />
          </TabsContent>
          <TabsContent value="edit" className="mt-0">
            <EditTab onHasResult={(v) => { editHasResult.current = v; }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
