import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { saveUploadedFile, extensionFromMimeType } from "@/lib/storage";

const ALLOWED_TYPES = ["video/webm", "video/mp4", "video/quicktime"];
const MAX_SIZE_BYTES = 300 * 1024 * 1024; // 300MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId") ?? undefined;
  const studentId = searchParams.get("studentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  if (!studentId) {
    // Browsing all submissions for an assignment (or everything) is
    // teacher-only — it exposes other students' recordings.
    const session = await getTeacherSession();
    if (!session) {
      return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
    }
  }

  const submissions = await prisma.submission.findMany({
    where: {
      ...(assignmentId ? { assignmentId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      assignment: true,
      student: true,
      feedbacks: { orderBy: { timestampSec: "asc" } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const studentId = formData.get("studentId");
  const assignmentId = formData.get("assignmentId");
  const video = formData.get("video");

  if (typeof studentId !== "string" || !studentId) {
    return NextResponse.json({ error: "학생 정보가 필요합니다." }, { status: 400 });
  }
  if (typeof assignmentId !== "string" || !assignmentId) {
    return NextResponse.json({ error: "과제 정보가 필요합니다." }, { status: 400 });
  }
  if (!(video instanceof File)) {
    return NextResponse.json({ error: "녹화 영상이 필요합니다." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.some((t) => video.type.startsWith(t.split("/")[0]))) {
    return NextResponse.json({ error: "지원하지 않는 영상 형식입니다." }, { status: 400 });
  }
  if (video.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "영상 크기는 300MB 이하여야 합니다." }, { status: 400 });
  }

  const [student, assignment] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId } }),
    prisma.assignment.findUnique({ where: { id: assignmentId } }),
  ]);
  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }

  const submissionId = crypto.randomUUID();
  const filename = `${submissionId}.${extensionFromMimeType(video.type)}`;
  const relativePath = await saveUploadedFile(video, "submissions", filename);

  const submission = await prisma.submission.create({
    data: {
      studentId,
      assignmentId,
      videoUrl: relativePath,
      mimeType: video.type || "video/webm",
    },
    include: { assignment: true, student: true },
  });

  return NextResponse.json(submission, { status: 201 });
}
