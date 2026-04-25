import { prisma } from "@/lib/prisma";
import type { GalleryApiItem, GalleryPayload } from "@/types";

export const runtime = "nodejs";

function errorDetails(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

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
    const details = errorDetails(e);
    return Response.json(
      {
        error: "Could not load gallery.",
        details,
        hint:
          process.env.VERCEL &&
          (details.includes("no such table") ||
            details.toLowerCase().includes("gallerypiece"))
            ? "Apply prisma/migrations/…/migration.sql to Turso (turso db shell …)."
            : undefined,
        items: [] as GalleryApiItem[],
      },
      { status: 500 }
    );
  }
}
