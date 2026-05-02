import { requireAdmin } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await requireAdmin();
    const album = await requireActiveAlbum();
    await prisma.sticker.createMany({
      data: Array.from({ length: album.totalStickers }, (_, index) => ({
        albumId: album.id,
        number: index + 1,
        code: "GEN",
        section: "General",
        name: `Cromo ${index + 1}`
      })),
      skipDuplicates: true
    });
    return json({ ok: true });
  } catch (error) {
    return badRequest(error);
  }
}
