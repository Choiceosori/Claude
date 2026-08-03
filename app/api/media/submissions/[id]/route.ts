import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";
import { resolveUploadPath } from "@/lib/storage";
import { serveFile } from "@/lib/serveFile";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "제출물을 찾을 수 없습니다." }, { status: 404 });
  }

  const [teacherSession, studentSession] = await Promise.all([getTeacherSession(), getStudentSession()]);
  const isOwner = studentSession?.studentId === submission.studentId;

  if (!teacherSession && !isOwner) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const [subdir, filename] = submission.videoUrl.split("/");
  const absolutePath = resolveUploadPath(subdir, filename);
  return serveFile(request, absolutePath, submission.mimeType);
}
