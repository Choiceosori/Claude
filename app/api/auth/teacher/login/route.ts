import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createTeacherSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { username } });
  if (!teacher) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, teacher.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const role = teacher.role === "ADMIN" ? "ADMIN" : "TEACHER";

  await createTeacherSession({
    teacherId: teacher.id,
    username: teacher.username,
    name: teacher.name,
    role,
  });

  return NextResponse.json({ name: teacher.name, username: teacher.username, role });
}
