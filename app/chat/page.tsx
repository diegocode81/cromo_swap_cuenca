import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ChatPage() {
  const user = await requireUser();
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { select: { id: true, name: true, zone: true } },
      userB: { select: { id: true, name: true, zone: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Chat</h1>
      <div className="grid gap-3">
        {conversations.map((conversation) => {
          const other = conversation.userAId === user.id ? conversation.userB : conversation.userA;
          return (
            <Link key={conversation.id} href={`/chat/${conversation.id}`} className="card block">
              <h2 className="text-lg font-black">{other.name}</h2>
              <p className="text-sm text-slate-600">{other.zone}</p>
              <p className="mt-2 truncate text-sm">{conversation.messages[0]?.content ?? "Sin mensajes todavia"}</p>
            </Link>
          );
        })}
        {conversations.length === 0 ? <div className="card text-slate-600">Aun no tienes conversaciones.</div> : null}
      </div>
    </section>
  );
}
