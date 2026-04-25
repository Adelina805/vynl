import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";

const DEFAULT_ROOT = path.join(process.cwd(), "data", "gallery");

export function galleryDataRoot(): string {
  return process.env.GALLERY_DATA_ROOT?.trim() || DEFAULT_ROOT;
}

export function galleryImagesDir(): string {
  return path.join(galleryDataRoot(), "images");
}

export function imageFilePath(id: string, imageExt: string): string {
  const safeExt = imageExt.replace(/[^a-z0-9]/gi, "").slice(0, 4) || "png";
  return path.join(galleryImagesDir(), `${id}.${safeExt}`);
}

export function extFromContentType(contentType: string | null): string {
  if (!contentType) return "png";
  const lower = contentType.toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
  if (lower.includes("webp")) return "webp";
  return "png";
}

export async function downloadImageBytes(
  url: string
): Promise<{ buffer: Buffer; contentType: string | null }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Image download failed: HTTP ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType: res.headers.get("content-type") };
}

export async function writeGalleryImageFile(
  id: string,
  imageExt: string,
  buffer: Buffer
): Promise<void> {
  const dir = galleryImagesDir();
  await mkdir(dir, { recursive: true });
  await writeFile(imageFilePath(id, imageExt), buffer);
}

export async function readGalleryImageFile(
  id: string,
  imageExt: string
): Promise<Buffer> {
  return readFile(imageFilePath(id, imageExt));
}

export async function deleteGalleryImageFile(
  id: string,
  imageExt: string
): Promise<void> {
  try {
    await unlink(imageFilePath(id, imageExt));
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
  }
}

/** Prisma `cuid()` / `cuid2()` — safe filename segment */
export function isSafeGalleryId(id: string): boolean {
  return /^[a-z0-9]+$/i.test(id) && id.length >= 20 && id.length <= 48;
}
