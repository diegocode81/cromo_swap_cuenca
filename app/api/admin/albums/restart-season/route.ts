import { requireAdmin } from "@/lib/auth";
import { buildStickerCatalog, totalFromSections } from "@/lib/album-admin";
import { albumSchema } from "@/lib/validators";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = albumSchema.parse(await request.json());
    const totalStickers = totalFromSections(data);
    const album = await prisma.$transaction(async (tx) => {
      await tx.album.updateMany({ where: { isActive: true }, data: { isActive: false, status: "ARCHIVED" } });
      const created = await tx.album.create({
        data: {
          name: data.name,
          description: data.description,
          totalStickers,
          isActive: true,
          status: "ACTIVE"
        }
      });
      await tx.sticker.createMany({ data: buildStickerCatalog(data, created.id) });
      return created;
    });
    return json({ album, message: "Temporada reiniciada sin borrar usuarios ni historial." }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
