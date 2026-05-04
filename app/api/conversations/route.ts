import { requireUser } from "@/lib/auth";
import { orderedPair } from "@/lib/domain";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { conversationSchema } from "@/lib/validators";

const conversationInclude = {
  album: true,
  userA: { select: { id: true, name: true, city: true } },
  userB: { select: { id: true, name: true, city: true } }
};

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      include: {
        album: true,
        userA: { select: { id: true, name: true, city: true } },
        userB: { select: { id: true, name: true, city: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
    return json({ conversations });
  } catch {
    return forbidden();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = conversationSchema.parse(await request.json());
    let otherUserId = data.userId;
    let albumId: string | undefined;

    if (data.exchangeMatchId) {
      const match = await prisma.exchangeMatch.findFirst({
        where: {
          id: data.exchangeMatchId,
          OR: [{ userAId: user.id }, { userBId: user.id }]
        }
      });
      if (!match) return json({ error: "Match no encontrado" }, { status: 404 });
      otherUserId = match.userAId === user.id ? match.userBId : match.userAId;
      albumId = match.albumId;
    }

    if (!otherUserId || otherUserId === user.id) return json({ error: "Usuario invalido" }, { status: 400 });
    const [userAId, userBId] = orderedPair(user.id, otherUserId);

    const existing = await prisma.conversation.findFirst({
      where: {
        userAId,
        userBId,
        exchangeMatchId: data.exchangeMatchId ?? null
      }
    });
    if (existing) return json({ conversation: existing });

    const conversation = await prisma.conversation.create({
      data: { userAId, userBId, exchangeMatchId: data.exchangeMatchId, albumId },
      include: conversationInclude
    });
    return json({ conversation }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
