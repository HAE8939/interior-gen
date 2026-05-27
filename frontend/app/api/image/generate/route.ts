import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; // allow up to 2 min for image gen

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    apiKey: string;
    baseUrl: string;
    model?: string;
    prompt: string;
    size?: string;
    quality?: string;
  };

  const { apiKey, baseUrl, model, prompt, size, quality } = body;
  if (!apiKey || !baseUrl || !prompt) {
    return NextResponse.json({ error: "Missing required fields: apiKey, baseUrl, prompt" }, { status: 400 });
  }

  const base = baseUrl.replace(/\/$/, "");
  const upstream = await fetch(`${base}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-image-2",
      prompt,
      n: 1,
      size: size ?? "1024x1024",
      quality: quality ?? "high",
      response_format: "url",
      output_format: "png",
    }),
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    const errMsg = `[generate] 上游 API 错误 ${upstream.status}: ${text.slice(0, 400)}`;
    console.error(errMsg);
    return NextResponse.json(
      { error: `上游 API 错误 ${upstream.status}: ${text.slice(0, 400)}` },
      { status: upstream.status },
    );
  }
  if (!text.trim()) {
    console.error("[generate] 上游 API 返回了空响应体");
    return NextResponse.json({ error: "上游 API 返回了空响应体" }, { status: 502 });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
