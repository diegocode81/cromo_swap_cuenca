import { requireAdmin } from "@/lib/auth";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = schema.parse(await request.json());
    const album = await prisma.$transaction(async (tx) => {
      if (data.isActive) {
        await tx.album.updateMany({ where: { isActive: true }, data: { isActive: false } });
      }
      return tx.album.update({ where: { id: params.id }, data });
    });
    return json({ album });
  } catch (error) {
    return badRequest(error);
  }
}
