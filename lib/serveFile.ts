import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

/** Serves a local file with HTTP Range support so <video> seeking works. */
export async function serveFile(request: NextRequest, absolutePath: string, mimeType: string) {
  let size: number;
  try {
    const stats = await stat(absolutePath);
    size = stats.size;
  } catch {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const range = request.headers.get("range");
  if (!range) {
    const stream = Readable.toWeb(createReadStream(absolutePath)) as ReadableStream;
    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match?.[1] ? parseInt(match[1], 10) : 0;
  const end = match?.[2] ? parseInt(match[2], 10) : size - 1;
  const chunkSize = end - start + 1;

  const stream = Readable.toWeb(createReadStream(absolutePath, { start, end })) as ReadableStream;
  return new NextResponse(stream, {
    status: 206,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
  });
}
