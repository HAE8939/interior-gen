/**
 * Image API utilities — calls our own Next.js proxy routes
 * (which in turn call PackyAPI server-side, avoiding CORS).
 *
 * Text-to-image: POST /api/image/generate
 * Image editing:  POST /api/image/edit
 * LLM optimize:   POST /api/llm/optimize
 */

import type { ImageGenSettings, LLMSettings } from "./settings-context";

// ─── Size mapping ─────────────────────────────────────────────────────────────

/** Map FormState ratio id → PackyAPI-compatible size string.
 *  Rules: multiples of 16, max 3840px, long:short ≤ 3:1 */
export function ratioToSize(ratioId: string): string {
  const map: Record<string, string> = {
    "1-1":  "1024x1024",
    "4-3":  "1024x768",
    "3-2":  "1536x1024",
    "16-9": "1792x1008",
    "9-16": "1008x1792",
    "2-3":  "1024x1536",
  };
  return map[ratioId] ?? "1024x1024";
}

// ─── Response parser ──────────────────────────────────────────────────────────

interface ImageApiResponse {
  data?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
  error?: string;
}

function parseImageResponse(json: ImageApiResponse): { url: string; revisedPrompt?: string } {
  if (json.error) throw new Error(json.error);
  const item = json.data?.[0];
  if (!item) throw new Error("API 返回格式异常：data 为空");
  const revisedPrompt = item.revised_prompt;
  if (item.url) return { url: item.url, revisedPrompt };
  if (item.b64_json) return { url: `data:image/png;base64,${item.b64_json}`, revisedPrompt };
  throw new Error("API 返回格式异常：无 url 或 b64_json 字段");
}

async function handleResponse(res: Response): Promise<{ url: string; revisedPrompt?: string }> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`上游 API 返回了空响应体 (HTTP ${res.status})，请检查 Base URL / API Key 是否正确`);
  }
  let json: ImageApiResponse;
  try {
    json = JSON.parse(text) as ImageApiResponse;
  } catch {
    // Not JSON — show raw snippet so the user / dev can diagnose
    throw new Error(`上游 API 响应不是 JSON (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(json.error ?? `代理错误 ${res.status}`);
  return parseImageResponse(json);
}

// ─── Text-to-image ────────────────────────────────────────────────────────────

export interface GenerateOptions {
  prompt: string;
  size?: string;
  quality?: "low" | "medium" | "high" | "auto";
}

export async function generateImage(
  cfg: ImageGenSettings,
  opts: GenerateOptions,
): Promise<{ url: string; revisedPrompt?: string }> {
  const res = await fetch("/api/image/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model || "gpt-image-2",
      prompt: opts.prompt,
      size: opts.size ?? "1024x1024",
      quality: opts.quality ?? "high",
    }),
  });
  return handleResponse(res);
}

// ─── Image editing ────────────────────────────────────────────────────────────

export interface EditOptions {
  /** Primary image to edit */
  image: File | Blob;
  /** Additional reference images (optional) */
  extraImages?: Array<File | Blob>;
  prompt: string;
  mask?: File | Blob;
  size?: string;
  quality?: "low" | "medium" | "high" | "auto";
  inputFidelity?: "low" | "high";
}

export async function editImage(
  cfg: ImageGenSettings,
  opts: EditOptions,
): Promise<{ url: string; revisedPrompt?: string }> {
  const form = new FormData();
  // Auth meta (stripped by proxy before forwarding)
  form.append("apiKey", cfg.apiKey);
  form.append("baseUrl", cfg.baseUrl);
  // Upstream fields
  form.append("model", cfg.model || "gpt-image-2");
  form.append("prompt", opts.prompt);
  form.append("image", opts.image, "image.png");
  if (opts.extraImages?.length) {
    opts.extraImages.forEach((img, i) => form.append("image", img, `image_${i + 2}.png`));
  }
  if (opts.mask) form.append("mask", opts.mask, "mask.png");
  form.append("n", "1");
  form.append("size", opts.size ?? "1024x1024");
  form.append("quality", opts.quality ?? "high");
  form.append("response_format", "url");
  form.append("output_format", "png");
  if (opts.inputFidelity) form.append("input_fidelity", opts.inputFidelity);

  const res = await fetch("/api/image/edit", {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}

// ─── LLM optimize ────────────────────────────────────────────────────────────

export async function optimizePrompt(
  cfg: LLMSettings,
  prompt: string,
): Promise<string> {
  if (!cfg.apiKey || !cfg.baseUrl) throw new Error("请先配置 LLM API Key 与 Base URL");
  const res = await fetch("/api/llm/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl,
      model: cfg.model || "deepseek-chat",
      prompt,
    }),
  });
  const json = (await res.json()) as { result?: string; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `LLM 代理错误 ${res.status}`);
  return json.result ?? "";
}
