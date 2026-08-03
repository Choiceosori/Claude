import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id: submissionId } = await params;
  const body = await request.json().catch(() => null);
  const timestampSec = Number(body?.timestampSec);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (Number.isNaN(timestampSec) || timestampSec < 0) {
    return NextResponse.json({ error: "타임스탬프가 올바르지 않습니다." }, { status: 400 });
  }
  if (!comment) {
    return NextResponse.json({ error: "코멘트를 입력해 주세요." }, { status: 400 });
  }

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    return NextResponse.json({ error: "제출물을 찾을 수 없습니다." }, { status: 404 });
  }

  const feedback = await prisma.feedback.create({
    data: { submissionId, timestampSec, comment },
  });

  return NextResponse.json(feedback, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id: submissionId } = await params;
  const { searchParams } = new URL(request.url);
  const feedbackId = searchParams.get("feedbackId");
  if (!feedbackId) {
    return NextResponse.json({ error: "feedbackId가 필요합니다." }, { status: 400 });
  }

  const feedback = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!feedback || feedback.submissionId !== submissionId) {
    return NextResponse.json({ error: "코멘트를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.feedback.delete({ where: { id: feedbackId } });
  return NextResponse.json({ ok: true });
}
