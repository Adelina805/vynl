import { prisma } from "@/lib/prisma";
import type { ArtStyle, GalleryCostSnapshot, GalleryPayload, SpotifyTrack } from "@/types";
import {
  downloadImageBytes,
  extFromContentType,
  writeGalleryImageFile,
} from "@/lib/gallery/storage";

export async function persistGalleryPiece(input: {
  falImageUrl: string;
  style: ArtStyle;
  track: SpotifyTrack;
  interpretation: string;
  imagePrompt: string;
  fluxPrompt: string;
  cost?: GalleryCostSnapshot;
}): Promise<{ id: string; persistedImageUrl: string }> {
  const { buffer, contentType } = await downloadImageBytes(input.falImageUrl);
  const imageExt = extFromContentType(contentType);

  const payload: GalleryPayload = {
    style: input.style,
    track: input.track,
    interpretation: input.interpretation,
    imagePrompt: input.imagePrompt,
    fluxPrompt: input.fluxPrompt,
    falSourceUrl: input.falImageUrl,
    ...(input.cost !== undefined ? { cost: input.cost } : {}),
  };

  const row = await prisma.galleryPiece.create({
    data: {
      imageExt,
      payload: payload as object,
    },
  });

  await writeGalleryImageFile(row.id, imageExt, buffer);

  return {
    id: row.id,
    persistedImageUrl: `/api/gallery/image/${row.id}`,
  };
}
