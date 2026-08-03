import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";
import { getBadgeTier, getNextBadgeGoal } from "@/lib/badges";

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
