import type { Prisma } from "@prisma/client";

type AlbumInput = {
  name?: string;
  description?: string;
  totalStickers?: number;
  sections?: { code: string; name: string; count: number }[];
};

export function validateUniqueSectionCodes(sections?: { code: string; name: string; count: number }[]) {
  if (!sections?.length) return;

  const seen = new Set<string>();
  const repeated = new Set<string>();

  sections.forEach((section) => {
    const code = section.code.toUpperCase();
    if (seen.has(code)) repeated.add(code);
    seen.add(code);
  });

  if (repeated.size > 0) {
    throw new Error(
      `Cada seccion debe tener un codigo unico. Codigos repetidos: ${Array.from(repeated).join(", ")}. Ejemplo: INT,Intro,40 y EQ1,Equipo 1,20.`
    );
  }
}

export function buildStickerCatalog(data: AlbumInput, albumId: string) {
  validateUniqueSectionCodes(data.sections);
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
      name: section.name
    }))
  );
}

export function totalFromSections(data: AlbumInput) {
  if (data.sections && data.sections.length > 0) {
    return data.sections.reduce((sum, section) => sum + section.count, 0);
  }
  return data.totalStickers ?? 1;
}

export async function albumHasCommunityData(tx: Prisma.TransactionClient, albumId: string) {
  const [inventories, matches] = await Promise.all([
    tx.userSticker.count({ where: { albumId } }),
    tx.exchangeMatch.count({ where: { albumId } })
  ]);

  return inventories + matches > 0;
}

export async function clearAlbumCommunityData(tx: Prisma.TransactionClient, albumId: string) {
  await tx.exchangeMatch.deleteMany({ where: { albumId } });
  await tx.userSticker.deleteMany({ where: { albumId } });
}

export async function deleteAlbumGraph(tx: Prisma.TransactionClient, albumId: string) {
  const albumUsers = await tx.userSticker.findMany({
    where: { albumId },
    select: { userId: true },
    distinct: ["userId"]
  });
  const albumMatches = await tx.exchangeMatch.findMany({
    where: { albumId },
    select: { userAId: true, userBId: true }
  });
  const candidateUserIds = new Set<string>();

  albumUsers.forEach((entry) => candidateUserIds.add(entry.userId));
  albumMatches.forEach((match) => {
    candidateUserIds.add(match.userAId);
    candidateUserIds.add(match.userBId);
  });
  await clearAlbumCommunityData(tx, albumId);
  await tx.sticker.deleteMany({ where: { albumId } });
  await tx.album.delete({ where: { id: albumId } });

  let deletedUsers = 0;
  for (const userId of candidateUserIds) {
    const remaining = await tx.user.findFirst({
      where: {
        id: userId,
        role: "USER",
        stickers: { none: {} },
        matchesAsA: { none: {} },
        matchesAsB: { none: {} },
        reportsMade: { none: {} },
        reportsGot: { none: {} }
      },
      select: { id: true }
    });

    if (remaining) {
      await tx.user.delete({ where: { id: userId } });
      deletedUsers += 1;
    }
  }

  return { deletedUsers };
}
