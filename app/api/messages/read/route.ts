import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const readSchema = z.object({ conversationId: z.string() });

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const { conversationId } = readSchema.parse(await request.json());
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ userAId: user.id }, { userBId: user.id }] }
    });
    if (!conversation) return json({ error: "Conversacion no encontrada" }, { status: 404 });
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id } },
      data: { isRead: true }
    });
    return json({ ok: true });
  } catch (error) {
    return badRequest(error);
  }
}
