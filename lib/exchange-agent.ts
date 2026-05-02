import { Prisma, PrismaClient } from "@prisma/client";

type AgentPrisma = PrismaClient;

type StickerInfo = {
  id: string;
  number: number;
  name: string;
  section: string;
};

type UserInventory = {
  id: string;
  name: string;
  zone: string;
  repeated: Map<string, StickerInfo>;
  missing: Map<string, StickerInfo>;
};

export type ExchangeAgentResult = {
  albumId: string | null;
  checkedUsers: number;
  generatedMatches: number;
  archivedMatches: number;
  logs: string[];
};

function scoreMatch(aToB: StickerInfo[], bToA: StickerInfo[], sameZone: boolean) {
  const usefulBothWays = aToB.length + bToA.length;
  const reciprocalBonus = aToB.length > 0 && bToA.length > 0 ? 25 : 0;
  const zoneBonus = sameZone ? 10 : 0;
  return Math.min(100, usefulBothWays * 8 + reciprocalBonus + zoneBonus);
}

export async function runExchangeAgent(prisma: AgentPrisma): Promise<ExchangeAgentResult> {
  const logs: string[] = [];
  const activeAlbum = await prisma.album.findFirst({ where: { isActive: true } });

  if (!activeAlbum) {
    logs.push("No active album found. Agent stopped.");
    return { albumId: null, checkedUsers: 0, generatedMatches: 0, archivedMatches: 0, logs };
  }

  logs.push(`Running ExchangeAgent for album ${activeAlbum.name} (${activeAlbum.id}).`);

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      zone: true,
      stickers: {
        where: { albumId: activeAlbum.id, status: { in: ["REPEATED", "MISSING"] } },
        include: { sticker: true }
      }
    }
  });

  const inventories: UserInventory[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    zone: user.zone,
    repeated: new Map(
      user.stickers
        .filter((entry) => entry.status === "REPEATED" && entry.quantity > 0)
        .map((entry) => [
          entry.stickerId,
          {
            id: entry.stickerId,
            number: entry.sticker.number,
            name: entry.sticker.name,
            section: entry.sticker.section
          }
        ])
    ),
    missing: new Map(
      user.stickers
        .filter((entry) => entry.status === "MISSING")
        .map((entry) => [
          entry.stickerId,
          {
            id: entry.stickerId,
            number: entry.sticker.number,
            name: entry.sticker.name,
            section: entry.sticker.section
          }
        ])
    )
  }));

  let generatedMatches = 0;
  const validKeys = new Set<string>();
  const now = new Date();

  for (let i = 0; i < inventories.length; i += 1) {
    for (let j = i + 1; j < inventories.length; j += 1) {
      const userA = inventories[i];
      const userB = inventories[j];
      const stickersFromAToB = Array.from(userA.repeated.values()).filter((sticker) =>
        userB.missing.has(sticker.id)
      );
      const stickersFromBToA = Array.from(userB.repeated.values()).filter((sticker) =>
        userA.missing.has(sticker.id)
      );

      if (stickersFromAToB.length === 0 && stickersFromBToA.length === 0) continue;

      const score = scoreMatch(stickersFromAToB, stickersFromBToA, userA.zone === userB.zone);
      validKeys.add(`${userA.id}:${userB.id}`);

      await prisma.exchangeMatch.upsert({
        where: {
          albumId_userAId_userBId: {
            albumId: activeAlbum.id,
            userAId: userA.id,
            userBId: userB.id
          }
        },
        update: {
          stickersFromAToB: stickersFromAToB as Prisma.InputJsonValue,
          stickersFromBToA: stickersFromBToA as Prisma.InputJsonValue,
          score,
          status: "SUGGESTED",
          lastCheckedAt: now
        },
        create: {
          albumId: activeAlbum.id,
          userAId: userA.id,
          userBId: userB.id,
          stickersFromAToB: stickersFromAToB as Prisma.InputJsonValue,
          stickersFromBToA: stickersFromBToA as Prisma.InputJsonValue,
          score,
          lastCheckedAt: now
        }
      });

      generatedMatches += 1;
    }
  }

  const existingMatches = await prisma.exchangeMatch.findMany({
    where: { albumId: activeAlbum.id, status: "SUGGESTED" },
    select: { id: true, userAId: true, userBId: true }
  });

  const staleIds = existingMatches
    .filter((match) => !validKeys.has(`${match.userAId}:${match.userBId}`))
    .map((match) => match.id);

  let archivedMatches = 0;
  if (staleIds.length > 0) {
    const result = await prisma.exchangeMatch.updateMany({
      where: { id: { in: staleIds } },
      data: { status: "ARCHIVED", lastCheckedAt: now }
    });
    archivedMatches = result.count;
  }

  logs.push(`Checked ${users.length} users.`);
  logs.push(`Generated or refreshed ${generatedMatches} matches.`);
  logs.push(`Archived ${archivedMatches} stale matches.`);

  return {
    albumId: activeAlbum.id,
    checkedUsers: users.length,
    generatedMatches,
    archivedMatches,
    logs
  };
}
