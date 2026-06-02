import type { Prisma, PrismaClient } from "@prisma/client";
import { INITIAL_CITIES, normalizeCityText, toCitySlug } from "./city-catalog";
import { prisma } from "./prisma";

export type CitiesSeedResult = {
  created: number;
  updated: number;
  total: number;
};

type CitySeedClient = PrismaClient | Prisma.TransactionClient;

export async function seedCities(client: CitySeedClient = prisma): Promise<CitiesSeedResult> {
  const existing = await client.city.findMany({
    select: { slug: true }
  });
  const existingSlugs = new Set(existing.map((city) => city.slug));

  let created = 0;
  let updated = 0;

  for (const city of INITIAL_CITIES) {
    const slug = city.slug ?? toCitySlug(city.name);
    const exists = existingSlugs.has(slug);

    await client.city.upsert({
      where: { slug },
      update: {
        name: city.name,
        province: city.province,
        ...(slug === "cuenca" ? { isActive: true } : {})
      },
      create: {
        name: city.name,
        province: city.province,
        slug,
        isActive: true
      }
    });

    if (exists) {
      updated += 1;
    } else {
      created += 1;
      existingSlugs.add(slug);
    }
  }

  return {
    created,
    updated,
    total: INITIAL_CITIES.length
  };
}

export async function preserveExistingUserCities(client: CitySeedClient = prisma) {
  const existingUserCities = await client.user.findMany({
    distinct: ["city"],
    where: { city: { not: "" } },
    select: { city: true }
  });

  for (const entry of existingUserCities) {
    const name = normalizeCityText(entry.city);
    if (!name) continue;

    await client.city.upsert({
      where: { slug: toCitySlug(name) },
      update: {},
      create: {
        name,
        province: "Sin definir",
        slug: toCitySlug(name),
        isActive: true
      }
    });
  }
}
