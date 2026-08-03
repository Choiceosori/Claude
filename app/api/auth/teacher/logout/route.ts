import { NextResponse } from "next/server";
import { destroyTeacherSession } from "@/lib/auth";

export async function POST() {
  await destroyTeacherSession();
  return NextResponse.json({ ok: true });
}
