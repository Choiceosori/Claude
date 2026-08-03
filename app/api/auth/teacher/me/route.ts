import { NextResponse } from "next/server";
import { getTeacherSession } from "@/lib/auth";

export async function GET() {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, ...session });
}
