import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.album.updateMany({ data: { isActive: false, status: "ARCHIVED" } });

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

    const album = await tx.album.create({
      data: {
        name: "Mundial 2026",
        description: "Album comunitario inicial para intercambiar cromos del Mundial 2026 en Cuenca.",
        totalStickers,
        isActive: true,
        status: "ACTIVE"
      }
    });

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

    await tx.user.upsert({
      where: { email: "admin@cromoswap.ec" },
      update: { role: "ADMIN", isActive: true },
      create: {
        name: "Admin CromoSwap",
        email: "admin@cromoswap.ec",
        passwordHash: await bcrypt.hash("Admin12345!", 12),
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
