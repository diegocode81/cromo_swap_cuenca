import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { userStickerSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const data = userStickerSchema.partial({ stickerId: true }).parse(await request.json());
    const existing = await prisma.userSticker.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return notFound();

    const entry = await prisma.userSticker.update({
      where: { id: params.id },
      data: {
        status: data.status ?? existing.status,
        quantity: (data.status ?? existing.status) === "REPEATED" ? data.quantity ?? existing.quantity : 1
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
    const existing = await prisma.userSticker.findFirst({ where: { id: params.id, userId: user.id } });
    if (!existing) return notFound();
    await prisma.userSticker.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch {
    return forbidden();
  }
}
