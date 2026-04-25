import { prisma } from "@/lib/prisma";
import {
  isSafeGalleryId,
  readGalleryImageFile,
} from "@/lib/gallery/storage";

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isSafeGalleryId(id)) {
    return new Response("Not found", { status: 404 });
  }

  const row = await prisma.galleryPiece.findUnique({
    where: { id },
    select: { imageExt: true },
  });

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buf = await readGalleryImageFile(id, row.imageExt);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": mimeFromExt(row.imageExt),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
