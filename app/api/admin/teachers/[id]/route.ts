import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** Admin-only: remove a TEACHER account. Admin accounts can't be deleted through this route. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await getTeacherSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.teacher.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "관리자 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  await prisma.teacher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
