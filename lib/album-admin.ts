import type { Prisma } from "@prisma/client";

type AlbumInput = {
  name: string;
  description: string;
  totalStickers?: number;
  sections?: { code: string; name: string; count: number }[];
};

export function buildStickerCatalog(data: AlbumInput, albumId: string) {
  const sections =
    data.sections && data.sections.length > 0
      ? data.sections
      : [{ code: "GEN", name: "General", count: data.totalStickers ?? 1 }];

  return sections.flatMap((section) =>
    Array.from({ length: section.count }, (_, index) => ({
      albumId,
      code: section.code,
      section: section.name,
      number: index + 1,
      name: `${section.code} ${index + 1}`
    }))
  );
}

export function totalFromSections(data: AlbumInput) {
  if (data.sections && data.sections.length > 0) {
    return data.sections.reduce((sum, section) => sum + section.count, 0);
  }
  return data.totalStickers ?? 1;
}

export async function deleteAlbumGraph(tx: Prisma.TransactionClient, albumId: string) {
  const conversations = await tx.conversation.findMany({
    where: {
      OR: [{ albumId }, { exchangeMatch: { albumId } }]
    },
    select: { id: true }
  });
  const conversationIds = conversations.map((conversation) => conversation.id);

  if (conversationIds.length > 0) {
    await tx.report.deleteMany({ where: { conversationId: { in: conversationIds } } });
    await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
    await tx.conversation.deleteMany({ where: { id: { in: conversationIds } } });
  }

  await tx.exchangeMatch.deleteMany({ where: { albumId } });
  await tx.userSticker.deleteMany({ where: { albumId } });
  await tx.sticker.deleteMany({ where: { albumId } });
  await tx.album.delete({ where: { id: albumId } });
}
