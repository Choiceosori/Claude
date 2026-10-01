import { del } from "@vercel/blob";

export async function deleteUploadedFile(pathname: string): Promise<void> {
  await del(pathname);
}
