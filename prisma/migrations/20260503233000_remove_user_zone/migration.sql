-- DropIndex
DROP INDEX IF EXISTS "User_city_zone_idx";

-- CreateIndex
CREATE INDEX "User_city_idx" ON "User"("city");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "zone";
