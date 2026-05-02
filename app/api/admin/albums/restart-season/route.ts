import { requireAdmin } from "@/lib/auth";
import { albumSchema } from "@/lib/validators";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = albumSchema.parse(await request.json());
    const album = await prisma.$transaction(async (tx) => {
      await tx.album.updateMany({ where: { isActive: true }, data: { isActive: false } });
      const created = await tx.album.create({ data: { ...data, isActive: true } });
      await tx.sticker.createMany({
        data: Array.from({ length: data.totalStickers }, (_, index) => ({
          albumId: created.id,
          number: index + 1,
          section: "General",
          name: `Cromo ${index + 1}`
        }))
      });
      return created;
    });
    return json({ album, message: "Temporada reiniciada sin borrar usuarios ni historial." }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
