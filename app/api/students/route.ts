import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getBadgeTier } from "@/lib/badges";

function countPassedSongs(submissions: { assignmentId: string; status: string }[]) {
  const passedAssignmentIds = new Set(
    submissions.filter((s) => s.status === "PASSED").map((s) => s.assignmentId)
  );
  return passedAssignmentIds.size;
}

/** Student self-identification: find-or-create by grade/class/number/name. No password. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const grade = Number(body?.grade);
  const classNo = Number(body?.classNo);
  const number = Number(body?.number);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
    return NextResponse.json({ error: "학년을 확인해 주세요." }, { status: 400 });
  }
  if (!Number.isInteger(classNo) || classNo < 1) {
    return NextResponse.json({ error: "반을 확인해 주세요." }, { status: 400 });
  }
  if (!Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "번호를 확인해 주세요." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  }

  const student = await prisma.student.upsert({
    where: { grade_classNo_number_name: { grade, classNo, number, name } },
    update: {},
    create: { grade, classNo, number, name },
  });

  return NextResponse.json(student);
}

/** Teacher-only: list students (optionally filtered by grade/class) with badge progress. */
export async function GET(request: NextRequest) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");
  const classNo = searchParams.get("classNo");

  const students = await prisma.student.findMany({
    where: {
      ...(grade ? { grade: Number(grade) } : {}),
      ...(classNo ? { classNo: Number(classNo) } : {}),
    },
    include: {
      submissions: { select: { assignmentId: true, status: true } },
    },
    orderBy: [{ grade: "asc" }, { classNo: "asc" }, { number: "asc" }],
  });

  const result = students.map((s) => {
    const passedSongs = countPassedSongs(s.submissions);
    return {
      id: s.id,
      grade: s.grade,
      classNo: s.classNo,
      number: s.number,
      name: s.name,
      passedSongs,
      badgeTier: getBadgeTier(passedSongs),
      submissionCount: s.submissions.length,
    };
  });

  return NextResponse.json(result);
}
