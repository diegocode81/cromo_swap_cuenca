import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.album.updateMany({ data: { isActive: false } });

    const album = await tx.album.create({
      data: {
        name: "Mundial 2026",
        description: "Album comunitario inicial para intercambiar cromos del Mundial 2026 en Cuenca.",
        totalStickers: 640,
        isActive: true
      }
    });

    const stickers = Array.from({ length: album.totalStickers }, (_, index) => {
      const number = index + 1;
      const section = number <= 40 ? "Intro" : `Equipo ${Math.ceil((number - 40) / 20)}`;
      return {
        albumId: album.id,
        number,
        section,
        name: `Cromo ${number}`,
        rarity: number % 50 === 0 ? "Especial" : null
      };
    });

    await tx.sticker.createMany({ data: stickers, skipDuplicates: true });

    await tx.user.upsert({
      where: { email: "admin@cromoswap.ec" },
      update: { role: "ADMIN", isActive: true },
      create: {
        name: "Admin CromoSwap",
        email: "admin@cromoswap.ec",
        passwordHash: await bcrypt.hash("Admin12345!", 12),
        city: "Cuenca",
        zone: "Centro Historico",
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
