import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";
import { getBadgeTier, getNextBadgeGoal } from "@/lib/badges";
import { deleteUploadedFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const [teacherSession, studentSession] = await Promise.all([getTeacherSession(), getStudentSession()]);
  const isOwner = studentSession?.studentId === id;
  if (!teacherSession && !isOwner) {
    return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  }

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          assignment: true,
          feedbacks: { orderBy: { timestampSec: "asc" } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  const passedAssignmentIds = new Set(
    student.submissions.filter((s) => s.status === "PASSED").map((s) => s.assignmentId)
  );
  const passedSongs = passedAssignmentIds.size;

  return NextResponse.json({
    id: student.id,
    grade: student.grade,
    classNo: student.classNo,
    number: student.number,
    name: student.name,
    passedSongs,
    badgeTier: getBadgeTier(passedSongs),
    nextGoal: getNextBadgeGoal(passedSongs),
    submissions: student.submissions,
  });
}

/** Teacher-only: fix a student's grade/class/number/name (typos, class reassignment, etc). */
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
  if (body.grade !== undefined) {
    const grade = Number(body.grade);
    if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
      return NextResponse.json({ error: "학년을 확인해 주세요." }, { status: 400 });
    }
    data.grade = grade;
  }
  if (body.classNo !== undefined) {
    const classNo = Number(body.classNo);
    if (!Number.isInteger(classNo) || classNo < 1) {
      return NextResponse.json({ error: "반을 확인해 주세요." }, { status: 400 });
    }
    data.classNo = classNo;
  }
  if (body.number !== undefined) {
    const number = Number(body.number);
    if (!Number.isInteger(number) || number < 1) {
      return NextResponse.json({ error: "번호를 확인해 주세요." }, { status: 400 });
    }
    data.number = number;
  }
  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
    }
    data.name = name;
  }

  try {
    const student = await prisma.student.update({ where: { id }, data });
    return NextResponse.json(student);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "같은 학년/반/번호/이름을 가진 학생이 이미 있어요." }, { status: 409 });
    }
    throw e;
  }
}

/** Teacher-only: remove a student and cascade their submissions/feedback. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { submissions: { select: { videoUrl: true } } },
  });
  if (!student) {
    return NextResponse.json({ error: "학생을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.student.delete({ where: { id } });

  // Best-effort: the submission rows are gone, clean up their video blobs too.
  await Promise.all(student.submissions.map((s) => deleteUploadedFile(s.videoUrl).catch(() => {})));

  return NextResponse.json({ ok: true });
}
