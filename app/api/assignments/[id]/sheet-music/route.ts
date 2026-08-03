import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { saveUploadedFile, extensionFromMimeType } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "PNG, JPEG, WEBP, PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "파일 크기는 15MB 이하여야 합니다." }, { status: 400 });
  }

  const filename = `${id}.${extensionFromMimeType(file.type)}`;
  const relativePath = await saveUploadedFile(file, "sheet-music", filename);

  const updated = await prisma.assignment.update({
    where: { id },
    data: { sheetMusicUrl: relativePath },
  });

  return NextResponse.json(updated);
}
