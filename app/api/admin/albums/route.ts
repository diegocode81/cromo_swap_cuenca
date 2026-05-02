import { requireAdmin } from "@/lib/auth";
import { buildStickerCatalog, totalFromSections } from "@/lib/album-admin";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { albumSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stickers: true, matches: true, userStickers: true } } }
    });
    return json({ albums });
  } catch {
    return forbidden();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = albumSchema.parse(await request.json());
    const totalStickers = totalFromSections(data);
    const album = await prisma.$transaction(async (tx) => {
      const created = await tx.album.create({
        data: {
          name: data.name,
          description: data.description,
          totalStickers,
          status: "DRAFT",
          isActive: false
        }
      });
      await tx.sticker.createMany({ data: buildStickerCatalog(data, created.id) });
      return created;
    });
    return json({ album }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
