import { prisma } from "@/lib/prisma";

export function orderedPair(userAId: string, userBId: string) {
  return [userAId, userBId].sort() as [string, string];
}

export async function getActiveAlbum() {
  return prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
}

export async function requireActiveAlbum() {
  const album = await getActiveAlbum();
  if (!album) throw new Error("NO_ACTIVE_ALBUM");
  return album;
}

export type StickerPayload = {
  id: string;
  number: number;
  code: string;
  name: string;
  section: string;
};

export function publicUserSelect() {
  return { id: true, name: true, city: true, createdAt: true };
}
