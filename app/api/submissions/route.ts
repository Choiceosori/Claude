import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";

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

/**
 * Records a submission after the browser has already uploaded the video
 * directly to Vercel Blob (see /api/blob/upload) — Vercel serverless
 * functions cap request bodies at 4.5MB, far below a typical recording, so
 * the video itself never passes through this route.
 */
export async function POST(request: NextRequest) {
  const studentSession = await getStudentSession();
  if (!studentSession) {
    return NextResponse.json({ error: "학생 로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const assignmentId = typeof body?.assignmentId === "string" ? body.assignmentId : "";
  const pathname = typeof body?.pathname === "string" ? body.pathname : "";

  if (!assignmentId) {
    return NextResponse.json({ error: "과제 정보가 필요합니다." }, { status: 400 });
  }
  if (!pathname.startsWith("submissions/")) {
    return NextResponse.json({ error: "녹화 영상 업로드 정보가 필요합니다." }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }

  // Confirm the upload actually landed in Blob storage (the client can't be
  // trusted to tell the truth) and read back its authoritative content type.
  let mimeType = "video/webm";
  try {
    const blob = await head(pathname);
    mimeType = blob.contentType || mimeType;
  } catch {
    return NextResponse.json({ error: "업로드된 영상을 찾을 수 없습니다. 다시 시도해 주세요." }, { status: 400 });
  }

  const submission = await prisma.submission.create({
    data: {
      studentId: studentSession.studentId,
      assignmentId,
      videoUrl: pathname,
      mimeType,
    },
    include: { assignment: true, student: true },
  });

  return NextResponse.json(submission, { status: 201 });
}
