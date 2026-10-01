import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { prisma } from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";
import { getStudentSession } from "@/lib/studentAuth";

const SHEET_MUSIC_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const SHEET_MUSIC_MAX_BYTES = 15 * 1024 * 1024; // 15MB

// MediaRecorder reports a codec-qualified type (e.g. "video/webm;codecs=vp9,opus"),
// so match on the broad category rather than an exact string.
const VIDEO_ALLOWED_TYPES = ["video/*"];
const VIDEO_MAX_BYTES = 300 * 1024 * 1024; // 300MB

type ClientPayload = { kind: "sheet-music"; assignmentId: string } | { kind: "submission"; assignmentId: string };

/**
 * Issues short-lived, pathname-scoped Vercel Blob upload tokens so the
 * browser can upload large videos/sheet music directly to Blob storage,
 * bypassing the ~4.5MB request body limit on Vercel serverless functions.
 * Our own auth/validation happens here, before a token is ever handed out —
 * the client never gets to upload anything we haven't explicitly allowed.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayloadRaw) => {
        let payload: ClientPayload;
        try {
          payload = JSON.parse(clientPayloadRaw ?? "");
        } catch {
          throw new Error("잘못된 업로드 요청입니다.");
        }

        if (payload.kind === "sheet-music") {
          const session = await getTeacherSession();
          if (!session) throw new Error("교사 로그인이 필요합니다.");

          const assignment = await prisma.assignment.findUnique({ where: { id: payload.assignmentId } });
          if (!assignment) throw new Error("과제를 찾을 수 없습니다.");

          if (!pathname.startsWith(`sheet-music/${payload.assignmentId}.`)) {
            throw new Error("잘못된 파일 경로입니다.");
          }

          return {
            allowedContentTypes: SHEET_MUSIC_TYPES,
            maximumSizeInBytes: SHEET_MUSIC_MAX_BYTES,
            allowOverwrite: true,
            addRandomSuffix: false,
          };
        }

        if (payload.kind === "submission") {
          const session = await getStudentSession();
          if (!session) throw new Error("학생 로그인이 필요합니다.");

          const assignment = await prisma.assignment.findUnique({ where: { id: payload.assignmentId } });
          if (!assignment) throw new Error("과제를 찾을 수 없습니다.");

          if (!pathname.startsWith("submissions/")) {
            throw new Error("잘못된 파일 경로입니다.");
          }

          return {
            allowedContentTypes: VIDEO_ALLOWED_TYPES,
            maximumSizeInBytes: VIDEO_MAX_BYTES,
            allowOverwrite: false,
            addRandomSuffix: false,
          };
        }

        throw new Error("잘못된 업로드 요청입니다.");
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드 요청에 실패했어요." }, { status: 400 });
  }
}
