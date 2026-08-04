import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";
import { saveUploadedFile, extensionFromMimeType } from "@/lib/storage";

const ALLOWED_TYPES = ["video/webm", "video/mp4", "video/quicktime"];
const MAX_SIZE_BYTES = 300 * 1024 * 1024; // 300MB

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const requestedStudentId = searchParams.get("studentId") ?? undefined;

  const teacherSession = await getTeacherSession();
  let studentId = requestedStudentId;

  if (!teacherSession) {
    // Non-teachers may only ever list their own submissions.
    const studentSession = await getStudentSession();
    if (!studentSession) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    studentId = studentSession.studentId;
  }

  const submissions = await prisma.submission.findMany({
    where: {
      ...(assignmentId ? { assignmentId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
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
  const studentSession = await getStudentSession();
  if (!studentSession) {
    return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const assignmentId = formData.get("assignmentId");
  const video = formData.get("video");

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

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }

  const submissionId = crypto.randomUUID();
  const filename = `${submissionId}.${extensionFromMimeType(video.type)}`;
  const relativePath = await saveUploadedFile(video, "submissions", filename);

  const submission = await prisma.submission.create({
    data: {
      studentId: studentSession.studentId,
      assignmentId,
      videoUrl: relativePath,
      mimeType: video.type || "video/webm",
    },
    include: { assignment: true, student: true },
  });

  return NextResponse.json(submission, { status: 201 });
}
