import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/image/download?url=<encoded-url>
 * Proxies a remote image and returns it as an attachment so the browser
 * triggers a Save dialog rather than navigating to the URL.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    return NextResponse.json({ error: `Fetch failed: ${String(e)}` }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `Upstream ${res.status}: ${res.statusText}` },
      { status: res.status },
    );
  }

  const contentType = res.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const filename = `prompt-draw-${Date.now()}.${ext}`;

  const arrayBuffer = await res.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
