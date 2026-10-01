import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serveBlobFile } from "@/lib/serveFile";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment?.sheetMusicUrl) {
    return NextResponse.json({ error: "악보를 찾을 수 없습니다." }, { status: 404 });
  }

  return serveBlobFile(request, assignment.sheetMusicUrl);
}
