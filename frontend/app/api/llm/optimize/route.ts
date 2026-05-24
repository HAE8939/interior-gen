import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    apiKey: string;
    baseUrl: string;
    model?: string;
    prompt: string; // the raw prompt to be optimised
  };

  const { apiKey, baseUrl, model, prompt } = body;
  if (!apiKey || !baseUrl || !prompt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const base = baseUrl.replace(/\/$/, "");
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are an expert interior design photography prompt engineer. " +
            "Refine the given prompt: improve clarity, remove redundancy, add photographic quality terms, " +
            "keep it in English. Return ONLY the refined prompt — no explanation, no markdown.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    const errMsg = `[llm/optimize] API 错误 ${res.status}: ${text.slice(0, 400)}`;
    console.error(errMsg);
    return NextResponse.json(
      { error: `LLM API 错误 ${res.status}: ${text.slice(0, 400)}` },
      { status: res.status },
    );
  }

  // Parse and return just the content string
  try {
    const json = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ result: content });
  } catch {
    console.error("[llm/optimize] 解析响应失败:", text.slice(0, 200));
    return NextResponse.json({ error: "解析 LLM 响应失败" }, { status: 500 });
  }
}
