import { prisma } from "@/lib/prisma";
import type { GalleryApiItem, GalleryPayload } from "@/types";

export async function GET() {
  try {
    const rows = await prisma.galleryPiece.findMany({
      orderBy: { createdAt: "desc" },
    });

    const items: GalleryApiItem[] = rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      imageUrl: `/api/gallery/image/${row.id}`,
      payload: row.payload as unknown as GalleryPayload,
    }));

    return Response.json({ items });
  } catch (e) {
    console.error("[gallery] list failed:", e);
    return Response.json(
      { error: "Could not load gallery.", items: [] as GalleryApiItem[] },
      { status: 500 }
    );
  }
}
