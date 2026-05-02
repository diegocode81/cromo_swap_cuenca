-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Album" ADD COLUMN "status" "AlbumStatus" NOT NULL DEFAULT 'DRAFT';

-- Preserve current active/inactive semantics for existing albums.
UPDATE "Album"
SET "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"AlbumStatus" ELSE 'ARCHIVED'::"AlbumStatus" END;

-- AlterTable
ALTER TABLE "Sticker" ADD COLUMN "code" TEXT NOT NULL DEFAULT 'GEN';

-- Existing catalogs had global numbering. New catalogs support numbers that restart per code.
DROP INDEX "Sticker_albumId_number_key";

-- CreateIndex
CREATE INDEX "Album_status_idx" ON "Album"("status");

-- CreateIndex
CREATE INDEX "Sticker_albumId_code_number_idx" ON "Sticker"("albumId", "code", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Sticker_albumId_code_number_key" ON "Sticker"("albumId", "code", "number");
