import { NextResponse } from "next/server";
import { destroyStudentSession } from "@/lib/studentAuth";

export async function POST() {
  await destroyStudentSession();
  return NextResponse.json({ ok: true });
}
