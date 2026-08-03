import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUploadPath } from "@/lib/storage";
import { serveFile } from "@/lib/serveFile";

type Params = { params: Promise<{ id: string }> };

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment?.sheetMusicUrl) {
    return NextResponse.json({ error: "악보를 찾을 수 없습니다." }, { status: 404 });
  }

  const [subdir, filename] = assignment.sheetMusicUrl.split("/");
  const absolutePath = resolveUploadPath(subdir, filename);
  const ext = filename.split(".").pop() ?? "";
  const mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return serveFile(request, absolutePath, mimeType);
}
