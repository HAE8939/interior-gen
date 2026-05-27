/**
 * GET  /api/config  — 读取配置
 *   优先级：环境变量（Vercel）> api-config.json（本地开发）> 默认值
 *
 * POST /api/config  — 写入配置
 *   本地开发：写入 api-config.json 文件
 *   Vercel：文件系统只读，写入会失败；返回 { ok:true, persisted:"browser" }
 *           客户端收到后转而存入 localStorage
 */

import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// 本地开发：api-config.json 在 frontend/ 上一级
const CONFIG_PATH = path.resolve(process.cwd(), "..", "api-config.json");

const DEFAULTS = {
  llm:      { apiKey: "", baseUrl: "", model: "" },
  imageGen: { apiKey: "", baseUrl: "", model: "gpt-image-2" },
};

/** 从 Vercel 环境变量读取配置 */
function fromEnv() {
  return {
    llm: {
      apiKey:  process.env.LLM_API_KEY  ?? "",
      baseUrl: process.env.LLM_BASE_URL ?? "",
      model:   process.env.LLM_MODEL    ?? "",
    },
    imageGen: {
      apiKey:  process.env.IMAGE_GEN_API_KEY  ?? "",
      baseUrl: process.env.IMAGE_GEN_BASE_URL ?? "",
      model:   process.env.IMAGE_GEN_MODEL    ?? "gpt-image-2",
    },
  };
}

export async function GET() {
  const env    = fromEnv();
  const hasEnv = !!(env.llm.apiKey || env.imageGen.apiKey);

  // ── 部署环境（Vercel）：直接返回环境变量 ──
  if (hasEnv) {
    return NextResponse.json({
      llm:      { ...DEFAULTS.llm,      ...env.llm },
      imageGen: { ...DEFAULTS.imageGen, ...env.imageGen },
      source: "env" as const,
    });
  }

  // ── 本地开发：从文件读取 ──
  try {
    const raw    = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as typeof DEFAULTS;
    return NextResponse.json({
      llm:      { ...DEFAULTS.llm,      ...parsed.llm },
      imageGen: { ...DEFAULTS.imageGen, ...parsed.imageGen },
      source: "file" as const,
    });
  } catch {
    return NextResponse.json({ ...DEFAULTS, source: "default" as const });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as typeof DEFAULTS;
    await fs.writeFile(
      CONFIG_PATH,
      JSON.stringify(body, null, 2) + "\n",
      "utf-8",
    );
    return NextResponse.json({ ok: true, persisted: "file" as const });
  } catch {
    // Vercel 只读文件系统 — 静默成功，由客户端写入 localStorage
    return NextResponse.json({ ok: true, persisted: "browser" as const });
  }
}
