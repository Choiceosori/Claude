import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

export const GUIDE_TYPES = ["recorder", "handbell", "melodica", "xylophone", "general"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");

  const assignments = await prisma.assignment.findMany({
    where: grade ? { targetGrade: Number(grade) } : undefined,
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(request: NextRequest) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const instrument = typeof body?.instrument === "string" ? body.instrument.trim() : "";
  const guideType = typeof body?.guideType === "string" ? body.guideType : "general";
  const targetGrade = Number(body?.targetGrade);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const dueDate = typeof body?.dueDate === "string" && body.dueDate ? new Date(body.dueDate) : null;

  if (!title) {
    return NextResponse.json({ error: "곡 제목을 입력해 주세요." }, { status: 400 });
  }
  if (!instrument) {
    return NextResponse.json({ error: "악기를 입력해 주세요." }, { status: 400 });
  }
  if (!Number.isInteger(targetGrade) || targetGrade < 1 || targetGrade > 6) {
    return NextResponse.json({ error: "대상 학년을 확인해 주세요." }, { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: { title, instrument, guideType, targetGrade, description, dueDate },
  });

  return NextResponse.json(assignment, { status: 201 });
}
