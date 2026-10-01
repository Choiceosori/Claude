import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * Proxies a private Vercel Blob object through our own route, forwarding
 * Range requests so <video> seeking keeps working. The client only ever
 * sees our /api/media/... URL — the actual Blob pathname/token never reach
 * the browser, preserving the same teacher-or-owner access control we had
 * with local-disk storage.
 */
export async function serveBlobFile(request: NextRequest, pathname: string, fallbackMimeType?: string) {
  const range = request.headers.get("range");

  let result;
  try {
    result = await get(pathname, {
      access: "private",
      headers: range ? { Range: range } : undefined,
    });
  } catch {
    return NextResponse.json({ error: "파일을 불러오지 못했습니다." }, { status: 502 });
  }

  if (!result || !result.stream) {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const contentRange = result.headers.get("content-range");
  const contentLength = result.headers.get("content-length");
  const contentType = result.blob.contentType || fallbackMimeType || "application/octet-stream";

  return new NextResponse(result.stream, {
    status: contentRange ? 206 : 200,
    headers: {
      "Content-Type": contentType,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
      ...(contentRange ? { "Content-Range": contentRange } : {}),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}
