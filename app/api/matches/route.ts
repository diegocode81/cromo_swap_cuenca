import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const album = await requireActiveAlbum();
    const matches = await prisma.exchangeMatch.findMany({
      where: {
        albumId: album.id,
        status: "SUGGESTED",
        OR: [{ userAId: user.id }, { userBId: user.id }]
      },
      include: {
        album: true,
        userA: { select: { id: true, name: true, zone: true, city: true } },
        userB: { select: { id: true, name: true, zone: true, city: true } }
      },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }]
    });
    return json({ matches, album });
  } catch {
    return forbidden();
  }
}
