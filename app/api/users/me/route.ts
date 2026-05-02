import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();
    const activeAlbum = await prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
    const [registered, repeated, missing, matches, unreadMessages] = await Promise.all([
      activeAlbum
        ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id } })
        : 0,
      activeAlbum
        ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "REPEATED" } })
        : 0,
      activeAlbum
        ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "MISSING" } })
        : 0,
      activeAlbum
        ? prisma.exchangeMatch.count({
            where: {
              albumId: activeAlbum.id,
              status: "SUGGESTED",
              OR: [{ userAId: user.id }, { userBId: user.id }]
            }
          })
        : 0,
      prisma.message.count({
        where: {
          isRead: false,
          senderId: { not: user.id },
          conversation: { OR: [{ userAId: user.id }, { userBId: user.id }] }
        }
      })
    ]);

    return json({
      user: { id: user.id, name: user.name, email: user.email, city: user.city, zone: user.zone, role: user.role },
      stats: { registered, repeated, missing, matches, unreadMessages },
      activeAlbum
    });
  } catch {
    return forbidden();
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, email: true, city: true, zone: true, role: true }
    });
    return json({ user: updated });
  } catch (error) {
    return badRequest(error);
  }
}
