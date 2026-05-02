import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { userStickerSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();
    const status = new URL(request.url).searchParams.get("status");
    const entries = await prisma.userSticker.findMany({
      where: {
        userId: user.id,
        albumId: album.id,
        ...(status ? { status: status as "HAVE" | "REPEATED" | "MISSING" } : {})
      },
      include: { sticker: true },
      orderBy: [{ sticker: { code: "asc" } }, { sticker: { number: "asc" } }]
    });
    return json({ entries, album });
  } catch {
    return forbidden();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();
    const data = userStickerSchema.parse(await request.json());
    const sticker = await prisma.sticker.findFirst({ where: { id: data.stickerId, albumId: album.id } });
    if (!sticker) return json({ error: "Cromo no pertenece al album activo" }, { status: 400 });

    const quantity = data.status === "REPEATED" ? data.quantity : 1;
    const entry = await prisma.userSticker.upsert({
      where: { userId_stickerId: { userId: user.id, stickerId: data.stickerId } },
      update: { status: data.status, quantity },
      create: { userId: user.id, albumId: album.id, stickerId: data.stickerId, status: data.status, quantity },
      include: { sticker: true }
    });

    return json({ entry }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
