import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

/** Admin-only: list every teacher/admin account (no password hashes). */
export async function GET() {
  const session = await getTeacherSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const teachers = await prisma.teacher.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(teachers);
}

/** Admin-only: create a new TEACHER account. Admin accounts are only ever provisioned via seed. */
export async function POST(request: NextRequest) {
  const session = await getTeacherSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!username) {
    return NextResponse.json({ error: "아이디를 입력해 주세요." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해 주세요." }, { status: 400 });
  }

  const existing = await prisma.teacher.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const teacher = await prisma.teacher.create({
    data: { username, passwordHash, name, role: "TEACHER" },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(teacher, { status: 201 });
}
