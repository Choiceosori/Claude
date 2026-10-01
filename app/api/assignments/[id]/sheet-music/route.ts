import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { deleteUploadedFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

/**
 * Records a sheet-music upload after the browser has already uploaded the
 * file directly to Vercel Blob (see /api/blob/upload) — bypasses the
 * ~4.5MB request body limit on Vercel serverless functions.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";
  if (!pathname.startsWith(`sheet-music/${id}.`)) {
    return NextResponse.json({ error: "악보 업로드 정보가 필요합니다." }, { status: 400 });
  }

  try {
    await head(pathname);
  } catch {
    return NextResponse.json({ error: "업로드된 악보를 찾을 수 없습니다. 다시 시도해 주세요." }, { status: 400 });
  }

  // Clean up the previous file if this upload landed at a different pathname
  // (different file extension than last time) — `allowOverwrite` already
  // handled the common case of re-uploading the same extension in place.
  if (assignment.sheetMusicUrl && assignment.sheetMusicUrl !== pathname) {
    await deleteUploadedFile(assignment.sheetMusicUrl).catch(() => {});
  }

  const updated = await prisma.assignment.update({
    where: { id },
    data: { sheetMusicUrl: pathname },
  });

  return NextResponse.json(updated);
}
