import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      assignment: true,
      student: true,
      feedbacks: { orderBy: { timestampSec: "asc" } },
    },
  });
  if (!submission) {
    return NextResponse.json({ error: "제출물을 찾을 수 없습니다." }, { status: 404 });
  }

  const teacherSession = await getTeacherSession();
  const { searchParams } = new URL(request.url);
  const requesterStudentId = searchParams.get("studentId");

  const isOwner = requesterStudentId && requesterStudentId === submission.studentId;
  if (!teacherSession && !isOwner) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  return NextResponse.json(submission);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && ["SUBMITTED", "PASSED", "NEEDS_PRACTICE"].includes(body.status)) {
    data.status = body.status;
    data.reviewedAt = new Date();
  }
  if (body.score !== undefined) {
    const score = body.score === null ? null : Number(body.score);
    if (score !== null && (Number.isNaN(score) || score < 0 || score > 100)) {
      return NextResponse.json({ error: "점수는 0~100 사이여야 합니다." }, { status: 400 });
    }
    data.score = score;
  }

  const submission = await prisma.submission.update({
    where: { id },
    data,
    include: { assignment: true, student: true, feedbacks: true },
  });

  return NextResponse.json(submission);
}
