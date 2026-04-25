import { prisma } from "@/lib/prisma";
import {
  deleteGalleryImageFile,
  isSafeGalleryId,
} from "@/lib/gallery/storage";

export const runtime = "nodejs";

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const secret = process.env.GALLERY_ADMIN_SECRET?.trim();
  if (!secret) {
    return new Response("Admin delete is not configured.", { status: 503 });
  }

  const auth = request.headers.get("authorization");
  const token =
    auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token || token !== secret) {
    return unauthorized();
  }

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

  await deleteGalleryImageFile(id, row.imageExt);
  await prisma.galleryPiece.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
