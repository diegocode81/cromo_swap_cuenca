import { requireAdmin } from "@/lib/auth";
import {
  albumHasCommunityData,
  buildStickerCatalog,
  clearAlbumCommunityData,
  deleteAlbumGraph,
  totalFromSections
} from "@/lib/album-admin";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().min(3).max(500).optional(),
    totalStickers: z.coerce.number().int().min(1).max(3000).optional(),
    sections: z
      .array(
        z.object({
          code: z.string().trim().min(2).max(8).transform((value) => value.toUpperCase()),
          name: z.string().trim().min(2).max(120),
          count: z.coerce.number().int().min(1).max(300)
        })
      )
      .min(1)
      .max(120)
      .optional(),
    isActive: z.boolean().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Sin cambios" });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = schema.parse(await request.json());
    const shouldActivate = data.status === "ACTIVE" || data.isActive === true;
    const shouldReplaceCatalog = Boolean(data.sections?.length || data.totalStickers);
    const album = await prisma.$transaction(async (tx) => {
      const currentAlbum = await tx.album.findUnique({ where: { id: params.id }, select: { status: true } });
      if (!currentAlbum) throw new Error("Album no encontrado");

      const hasCommunityData = shouldReplaceCatalog ? await albumHasCommunityData(tx, params.id) : false;
      if (shouldReplaceCatalog && hasCommunityData && currentAlbum.status !== "DRAFT") {
        throw new Error("Solo puedes regenerar el catalogo con datos existentes si el album esta en borrador.");
      }

      if (shouldActivate) {
        await tx.album.updateMany({
          where: { isActive: true },
          data: { isActive: false, status: "ARCHIVED" }
        });
      }
      const status = data.status ?? (data.isActive === false ? "ARCHIVED" : undefined);
      if (shouldReplaceCatalog) {
        if (hasCommunityData) {
          await clearAlbumCommunityData(tx, params.id);
        }
        await tx.sticker.deleteMany({ where: { albumId: params.id } });
        await tx.sticker.createMany({ data: buildStickerCatalog(data, params.id) });
      }

      return tx.album.update({
        where: { id: params.id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(shouldReplaceCatalog ? { totalStickers: totalFromSections(data) } : {}),
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
    const result = await prisma.$transaction(async (tx) => {
      return deleteAlbumGraph(tx, params.id);
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return badRequest(error);
  }
}
