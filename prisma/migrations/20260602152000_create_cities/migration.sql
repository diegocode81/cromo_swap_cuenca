-- Create persistent Ecuador city catalog without changing existing User.city data.
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");
CREATE UNIQUE INDEX "cities_name_province_key" ON "cities"("name", "province");
CREATE INDEX "cities_isActive_name_idx" ON "cities"("isActive", "name");
