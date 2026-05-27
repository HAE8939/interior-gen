import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const apiKey = formData.get("apiKey") as string | null;
  const baseUrl = formData.get("baseUrl") as string | null;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: "Missing apiKey or baseUrl" }, { status: 400 });
  }

  // Build upstream FormData (strip our auth meta fields)
  const upstream = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === "apiKey" || key === "baseUrl") continue;
    upstream.append(key, value);
  }

  const base = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/v1/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  const text = await res.text();
  if (!res.ok) {
    const errMsg = `[edit] 上游 API 错误 ${res.status}: ${text.slice(0, 400)}`;
    console.error(errMsg);
    return NextResponse.json(
      { error: `上游 API 错误 ${res.status}: ${text.slice(0, 400)}` },
      { status: res.status },
    );
  }
  if (!text.trim()) {
    console.error("[edit] 上游 API 返回了空响应体");
    return NextResponse.json({ error: "上游 API 返回了空响应体" }, { status: 502 });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
