import { requireUser } from "@/lib/auth";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = reportSchema.parse(await request.json());
    if (data.reportedUserId === user.id) return json({ error: "No puedes reportarte a ti mismo" }, { status: 400 });

    const reportedUser = await prisma.user.findUnique({
      where: { id: data.reportedUserId },
      select: { id: true }
    });
    if (!reportedUser) return json({ error: "Usuario reportado no encontrado" }, { status: 404 });

    if (data.conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: data.conversationId,
          OR: [{ userAId: user.id }, { userBId: user.id }]
        },
        select: { userAId: true, userBId: true }
      });
      const isReportedParticipant =
        conversation?.userAId === data.reportedUserId || conversation?.userBId === data.reportedUserId;

      if (!conversation || !isReportedParticipant) {
        return json({ error: "Conversacion invalida para este reporte" }, { status: 400 });
      }
    }

    const report = await prisma.report.create({ data: { ...data, reporterId: user.id } });
    return json({ report }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
