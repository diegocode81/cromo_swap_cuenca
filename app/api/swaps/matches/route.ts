import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { buildSwapMatches } from "@/lib/swap-matching";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();

    if (!user.city?.trim()) {
      return json({ error: "Tu usuario no tiene ciudad configurada." }, { status: 400 });
    }

    const [stickers, users] = await Promise.all([
      prisma.sticker.findMany({
        where: { albumId: album.id },
        select: { id: true },
        orderBy: [{ code: "asc" }, { number: "asc" }]
      }),
      prisma.user.findMany({
        where: { isActive: true, city: user.city },
        select: {
          id: true,
          name: true,
          city: true,
          phone: true,
          stickers: {
            where: { albumId: album.id, status: { in: ["HAVE", "REPEATED", "MISSING"] } },
            include: { sticker: true }
          }
        }
      })
    ]);

    const currentUser = users.find((candidate) => candidate.id === user.id);
    if (!currentUser) return forbidden();

    const matches = buildSwapMatches({
      currentUser,
      candidates: users,
      albumStickerIds: stickers.map((sticker) => sticker.id)
    });

    return json({ matches, album: { id: album.id, name: album.name }, city: user.city, currentUserHasPhone: Boolean(user.phone) });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_CITY_REQUIRED") {
      return json({ error: "Tu usuario no tiene ciudad configurada." }, { status: 400 });
    }
    return badRequest(error);
  }
}
