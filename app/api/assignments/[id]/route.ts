import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { deleteUploadedFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(assignment);
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
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.instrument === "string") data.instrument = body.instrument.trim();
  if (typeof body.guideType === "string") data.guideType = body.guideType;
  if (body.targetGrade !== undefined) data.targetGrade = Number(body.targetGrade);
  if (typeof body.description === "string") data.description = body.description.trim();
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const assignment = await prisma.assignment.update({ where: { id }, data });
  return NextResponse.json(assignment);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { submissions: { select: { videoUrl: true } } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.assignment.delete({ where: { id } });

  // Cascade-deleted the DB rows; best-effort clean up the now-unreferenced
  // blobs too so storage usage doesn't grow forever. Not fatal if this fails.
  const pathnames = [
    ...(assignment.sheetMusicUrl ? [assignment.sheetMusicUrl] : []),
    ...assignment.submissions.map((s) => s.videoUrl),
  ];
  await Promise.all(pathnames.map((p) => deleteUploadedFile(p).catch(() => {})));

  return NextResponse.json({ ok: true });
}
