import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const conversationId = new URL(request.url).searchParams.get("conversationId");
    if (!conversationId) return json({ error: "conversationId requerido" }, { status: 400 });

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ userAId: user.id }, { userBId: user.id }] }
    });
    if (!conversation) return json({ error: "Conversacion no encontrada" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" }
    });
    return json({ messages });
  } catch {
    return forbidden();
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = messageSchema.parse(await request.json());
    const conversation = await prisma.conversation.findFirst({
      where: { id: data.conversationId, OR: [{ userAId: user.id }, { userBId: user.id }] }
    });
    if (!conversation) return json({ error: "Conversacion no encontrada" }, { status: 404 });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: data.conversationId, senderId: user.id, content: data.content }
      });
      await tx.conversation.update({ where: { id: data.conversationId }, data: { updatedAt: new Date() } });
      return created;
    });
    return json({ message }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
