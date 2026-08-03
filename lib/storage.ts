import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.UPLOAD_DIR ?? "./storage/uploads"
);

/** Sanitizes a single path segment so it cannot escape the upload root. */
function safeSegment(segment: string): string {
  const cleaned = segment.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!cleaned || cleaned === "." || cleaned === "..") {
    throw new Error(`Invalid path segment: ${segment}`);
  }
  return cleaned;
}

export function resolveUploadPath(...segments: string[]): string {
  const safeSegments = segments.map(safeSegment);
  return path.join(UPLOAD_ROOT, ...safeSegments);
}

export async function saveUploadedFile(file: File, subdir: string, filename: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, safeSegment(subdir));
  await mkdir(dir, { recursive: true });
  const safeName = safeSegment(filename);
  const fullPath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return `${subdir}/${safeName}`;
}

export function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("quicktime")) return "mov";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("pdf")) return "pdf";
  return "bin";
}
