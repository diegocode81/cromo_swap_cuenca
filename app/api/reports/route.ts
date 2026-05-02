import { requireUser } from "@/lib/auth";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const data = reportSchema.parse(await request.json());
    if (data.reportedUserId === user.id) return json({ error: "No puedes reportarte a ti mismo" }, { status: 400 });
    const report = await prisma.report.create({ data: { ...data, reporterId: user.id } });
    return json({ report }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
