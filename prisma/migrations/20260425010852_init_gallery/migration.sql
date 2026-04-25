-- CreateTable
CREATE TABLE "GalleryPiece" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageExt" TEXT NOT NULL,
    "payload" JSONB NOT NULL
);
