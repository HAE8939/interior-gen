"use client";

/**
 * WhiteModelTab
 * ─────────────
 * Upload a 3D architectural white model render → AI applies materials/style/lighting
 * from the current form state to produce a photorealistic interior visualization.
 *
 * Layout: two-column workbench (controls left | result right/sticky)
 */

import { ArrowLeft, BoxIcon, Download, ImageIcon, Loader2, Upload, X } from "lucide-react";
import * as React from "react";

import { useErrorLog } from "@/lib/error-log-context";
import { useForm } from "@/lib/form-context";
import { assemble } from "@/lib/prompt-assembler";
import { editImage, ratioToSize } from "@/lib/image-api";
import { useSettings } from "@/lib/settings-context";
import { findById, vocab } from "@/lib/vocab";

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<void> {
  if (url.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `white-model-${Date.now()}.png`;
    a.click();
    return;
  }
  const res = await fetch(`/api/image/download?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`下载失败 ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `white-model-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ─── Empty result placeholder ─────────────────────────────────────────────────

function EmptyResultState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border/30 bg-muted/10 min-h-[360px] p-10 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <ImageIcon className="size-10 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground cn">赋材结果将在此处显示</p>
        <p className="text-xs text-muted-foreground/60 cn">上传白模图片后点击「开始赋材」</p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WhiteModelTabProps {
  onGoToPromptWorkshop: () => void;
  onHasResult: (v: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhiteModelTab({ onGoToPromptWorkshop, onHasResult }: WhiteModelTabProps) {
  const { state } = useForm();
  const { settings, isImageGenConfigured } = useSettings();
  const { log } = useErrorLog();

  const [uploadedImage, setUploadedImage] = React.useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ url: string; revisedPrompt?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Always high fidelity — preserve spatial structure
  const fidelity = "high" as const;
  const size = ratioToSize(state.ratio);

  const whiteModelTemplate = React.useMemo(
    () => findById(vocab.templates, "white-model-materialization"),
    [],
  );

  const assembled = React.useMemo(() => {
    if (!whiteModelTemplate) return null;
    return assemble(state, whiteModelTemplate);
  }, [state, whiteModelTemplate]);

  React.useEffect(() => {
    onHasResult(result !== null);
  }, [result, onHasResult]);

  React.useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage({ file, previewUrl: URL.createObjectURL(file) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleRemoveImage = () => {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
    setResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!isImageGenConfigured || !uploadedImage || !assembled?.prompt_en) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await editImage(settings.imageGen, {
        image: uploadedImage.file,
        prompt: assembled.prompt_en,
        size,
        inputFidelity: fidelity,
      });
      setResult(r);
      log("info", "白膜生图", `赋材成功，尺寸 ${size}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      log("error", "白膜生图", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadImage(result.url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  };

  const canGenerate =
    isImageGenConfigured && uploadedImage !== null && assembled?.prompt_en && !loading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* ── Controls (left) ── */}
      <div className="lg:col-span-5 space-y-5">
        {/* Explainer */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 space-y-1.5">
          <p className="text-sm font-medium cn flex items-center gap-2">
            <BoxIcon className="size-4 text-primary shrink-0" />
            白膜赋材工作流
          </p>
          <p className="text-sm text-muted-foreground cn leading-relaxed">
            上传 3D 白模渲染图（灰白无纹理建模截图），AI 将根据
            <button
              type="button"
              onClick={onGoToPromptWorkshop}
              className="text-primary hover:underline mx-1 cn"
            >
              提示词工坊
            </button>
            中已选的风格、材质、光照参数，生成保留空间结构的逼真效果图。
          </p>
        </div>

        {/* Upload */}
        <div>
          <label className="text-sm font-medium cn mb-2 block">白模图片</label>
          {uploadedImage ? (
            <div className="relative rounded-xl overflow-hidden border border-border/60 aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage.previewUrl}
                alt="白模图片"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
                title="移除图片"
              >
                <X className="size-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white cn">
                {uploadedImage.file.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-background/40 py-10 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Upload className="size-7 opacity-50" />
              <span className="text-sm cn">点击或拖入白模渲染图（PNG / JPG）</span>
              <span className="text-xs text-muted-foreground/60 cn">
                建议使用 3D 软件导出的白色 / 灰色无材质渲染
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Assembled prompt preview */}
        {assembled?.prompt_en && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium cn">赋材提示词（自动生成）</p>
              <button
                type="button"
                onClick={onGoToPromptWorkshop}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline cn"
              >
                <ArrowLeft className="size-3" />
                去调整参数
              </button>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/60 p-3">
              <p className="text-xs font-mono text-foreground/70 leading-relaxed break-words">
                {assembled.prompt_en}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60 cn">
              保真度：高保真（固定）· 输出尺寸：{size}
            </p>
          </div>
        )}

        {!whiteModelTemplate && (
          <p className="text-sm text-amber-600 dark:text-amber-400 cn">
            ⚠ 未找到白膜赋材模板，请检查 vocabulary/prompt_templates.json。
          </p>
        )}

        {/* Generate button */}
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={!canGenerate}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cn shadow-sm"
        >
          {loading ? (
            <><Loader2 className="size-4 animate-spin" />赋材中…</>
          ) : (
            <><BoxIcon className="size-4" />开始赋材</>
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
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold cn text-foreground/80">赋材结果</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDownload()}
                    disabled={downloading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cn"
                  >
                    {downloading ? (
                      <><Loader2 className="size-3.5 animate-spin" />保存中…</>
                    ) : (
                      <><Download className="size-3.5" />保存图片</>
                    )}
                  </button>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline cn"
                  >
                    新标签页 ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      onHasResult(false);
                    }}
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
                src={result.url}
                alt="白膜赋材结果"
                className="w-full rounded-2xl border border-border/40 object-cover shadow-sm"
              />

              {result.revisedPrompt && (
                <p className="text-xs text-muted-foreground cn leading-relaxed italic">
                  模型重写：{result.revisedPrompt}
                </p>
              )}
            </div>
          ) : (
            <EmptyResultState />
          )}
        </div>
      </div>
    </div>
  );
}
