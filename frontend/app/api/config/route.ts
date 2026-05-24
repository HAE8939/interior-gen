/**
 * GET  /api/config  — Read api-config.json from project root (one level above frontend/)
 * POST /api/config  — Write (create or overwrite) api-config.json
 *
 * process.cwd() when running `pnpm dev` from frontend/ = <project>/frontend
 * so CONFIG_PATH resolves to <project>/api-config.json
 */

import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const CONFIG_PATH = path.resolve(process.cwd(), "..", "api-config.json");

const DEFAULTS = {
  llm:      { apiKey: "", baseUrl: "", model: "" },
  imageGen: { apiKey: "", baseUrl: "https://api.example.com", model: "gpt-image-2" },
};

export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as typeof DEFAULTS;
    // Deep-merge: fill any missing keys with defaults
    return NextResponse.json({
      llm:      { ...DEFAULTS.llm,      ...parsed.llm },
      imageGen: { ...DEFAULTS.imageGen, ...parsed.imageGen },
    });
  } catch {
    // File doesn't exist yet — return defaults silently
    return NextResponse.json(DEFAULTS);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as typeof DEFAULTS;
    await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2) + "\n", "utf-8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[config] 写入失败:", msg);
    return NextResponse.json({ error: `写入配置文件失败: ${msg}` }, { status: 500 });
  }
}
