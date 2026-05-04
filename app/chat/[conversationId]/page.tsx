import { notFound } from "next/navigation";
import { ChatClient } from "@/components/chat-client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const user = await requireUser();
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { select: { id: true, name: true, city: true } },
      userB: { select: { id: true, name: true, city: true } }
    }
  });
  if (!conversation) notFound();
  const other = conversation.userAId === user.id ? conversation.userB : conversation.userA;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">{other.name}</h1>
        <p className="text-sm text-slate-600">{other.city}</p>
      </div>
      <ChatClient conversationId={conversation.id} currentUserId={user.id} reportedUserId={other.id} />
    </section>
  );
}
