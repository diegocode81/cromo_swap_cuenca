import { requireAdmin } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { stickerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const activeAlbum = await requireActiveAlbum();
    const data = stickerSchema.parse(await request.json());
    const sticker = await prisma.sticker.create({
      data: { ...data, albumId: data.albumId ?? activeAlbum.id, rarity: data.rarity ?? null }
    });
    return json({ sticker }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
