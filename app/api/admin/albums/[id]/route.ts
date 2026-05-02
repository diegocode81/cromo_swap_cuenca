import { requireAdmin } from "@/lib/auth";
import { deleteAlbumGraph } from "@/lib/album-admin";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = schema.parse(await request.json());
    const shouldActivate = data.status === "ACTIVE" || data.isActive === true;
    const album = await prisma.$transaction(async (tx) => {
      if (shouldActivate) {
        await tx.album.updateMany({
          where: { isActive: true },
          data: { isActive: false, status: "ARCHIVED" }
        });
      }
      const status = data.status ?? (data.isActive === false ? "ARCHIVED" : undefined);
      return tx.album.update({
        where: { id: params.id },
        data: {
          ...(status ? { status } : {}),
          ...(shouldActivate ? { isActive: true } : {}),
          ...(data.isActive === false ? { isActive: false } : {})
        }
      });
    });
    return json({ album });
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      await deleteAlbumGraph(tx, params.id);
    });
    return json({ ok: true });
  } catch (error) {
    return badRequest(error);
  }
}
