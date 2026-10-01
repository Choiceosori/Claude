"use client";

import { upload } from "@vercel/blob/client";
import { extensionFromMimeType } from "@/lib/mimeTypes";

// Large video uploads over a slow connection legitimately take a while, but
// without a bound a dropped connection leaves the student stuck on
// "제출 중..." forever instead of seeing an error and being able to retry.
const SUBMISSION_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const SHEET_MUSIC_UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;

/** Uploads a recorded video directly to Blob storage, bypassing our server entirely for the bytes. */
export async function uploadSubmissionVideo(assignmentId: string, blob: Blob, mimeType: string) {
  const ext = extensionFromMimeType(mimeType);
  const pathname = `submissions/${crypto.randomUUID()}.${ext}`;

  const result = await upload(pathname, blob, {
    access: "private",
    contentType: mimeType,
    handleUploadUrl: "/api/blob/upload",
    clientPayload: JSON.stringify({ kind: "submission", assignmentId }),
    abortSignal: AbortSignal.timeout(SUBMISSION_UPLOAD_TIMEOUT_MS),
  });

  return result.pathname;
}

/** Uploads sheet music directly to Blob storage. */
export async function uploadSheetMusic(assignmentId: string, file: File) {
  const ext = extensionFromMimeType(file.type);
  const pathname = `sheet-music/${assignmentId}.${ext}`;

  const result = await upload(pathname, file, {
    access: "private",
    contentType: file.type,
    handleUploadUrl: "/api/blob/upload",
    clientPayload: JSON.stringify({ kind: "sheet-music", assignmentId }),
    abortSignal: AbortSignal.timeout(SHEET_MUSIC_UPLOAD_TIMEOUT_MS),
  });

  return result.pathname;
}
