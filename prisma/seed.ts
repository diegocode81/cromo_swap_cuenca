import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { INITIAL_CITIES, normalizeCityText, toCitySlug } from "../lib/city-catalog";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const city of INITIAL_CITIES) {
      await tx.city.upsert({
        where: { slug: toCitySlug(city.name) },
        update: {
          name: city.name,
          province: city.province,
          isActive: true
        },
        create: {
          name: city.name,
          province: city.province,
          slug: toCitySlug(city.name)
        }
      });
    }

    const existingUserCities = await tx.user.findMany({
      distinct: ["city"],
      where: { city: { not: "" } },
      select: { city: true }
    });

    for (const entry of existingUserCities) {
      const name = normalizeCityText(entry.city);
      if (!name) continue;

      await tx.city.upsert({
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

    const mundialSections = [
      ["HAI", "Haiti", 20],
      ["ECU", "Ecuador", 20],
      ["ARG", "Argentina", 20],
      ["BRA", "Brasil", 20],
      ["FRA", "Francia", 20],
      ["ESP", "Espana", 20],
      ["MEX", "Mexico", 20],
      ["USA", "Estados Unidos", 20],
      ["CAN", "Canada", 20],
      ["GEN", "General", 40]
    ] as const;
    const totalStickers = mundialSections.reduce((sum, section) => sum + section[2], 0);

    const existingAlbum = await tx.album.findFirst({ where: { name: "Mundial 2026" } });
    const activeAlbum = await tx.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
    const album =
      existingAlbum ??
      (await tx.album.create({
        data: {
          name: "Mundial 2026",
          description: "Album comunitario para intercambiar cromos del Mundial 2026 entre coleccionistas de Ecuador.",
          totalStickers,
          isActive: !activeAlbum,
          status: activeAlbum ? "DRAFT" : "ACTIVE"
        }
      }));

    if (existingAlbum) {
      await tx.album.update({
        where: { id: existingAlbum.id },
        data: {
          totalStickers
        }
      });
    }

    const stickers = mundialSections.flatMap(([code, section, count]) =>
      Array.from({ length: count }, (_, index) => ({
        albumId: album.id,
        code,
        number: index + 1,
        section,
        name: `${code} ${index + 1}`,
        rarity: index + 1 === count ? "Especial" : null
      }))
    );

    await tx.sticker.createMany({ data: stickers, skipDuplicates: true });

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cromoswap.ec";
    const existingAdmin = await tx.user.findUnique({ where: { email: adminEmail } });
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!existingAdmin && !adminPassword) {
      throw new Error("SEED_ADMIN_PASSWORD es requerido para crear el usuario admin inicial.");
    }

    await tx.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", isActive: true },
      create: {
        name: "Admin CromoSwap Ecuador",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword as string, 12),
        city: "Cuenca",
        role: "ADMIN"
      }
    });
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
