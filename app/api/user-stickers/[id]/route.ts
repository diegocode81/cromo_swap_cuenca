import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { badRequest, forbidden, json, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { userStickerSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();
    const data = userStickerSchema.partial({ stickerId: true }).parse(await request.json());
    const existing = await prisma.userSticker.findFirst({ where: { id: params.id, userId: user.id, albumId: album.id } });
    if (!existing) return notFound();

    const nextStatus = data.status ?? existing.status;
    if (nextStatus === "REPEATED" && existing.status === "MISSING") {
      return json({ error: "Marca Tengo antes de agregar repetidos" }, { status: 400 });
    }

    const entry = await prisma.userSticker.update({
      where: { id: params.id },
      data: {
        status: nextStatus,
        quantity: nextStatus === "REPEATED" ? data.quantity ?? existing.quantity : 1
      },
      include: { sticker: true }
    });
    return json({ entry });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();
    const existing = await prisma.userSticker.findFirst({ where: { id: params.id, userId: user.id, albumId: album.id } });
    if (!existing) return notFound();
    await prisma.userSticker.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch {
    return forbidden();
  }
}
