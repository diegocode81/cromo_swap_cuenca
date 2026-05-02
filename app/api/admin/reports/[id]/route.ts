import { requireAdmin } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = schema.parse(await request.json());
    const report = await prisma.report.update({ where: { id: params.id }, data });
    return json({ report });
  } catch (error) {
    return badRequest(error);
  }
}
