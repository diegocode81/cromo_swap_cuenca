import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireActiveAlbum } from "@/lib/domain";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");
    const q = searchParams.get("q")?.trim();
    const resolvedAlbumId = albumId ?? (await requireActiveAlbum()).id;
    const search = q
      ? [
          ...(/^\d+$/.test(q) ? [{ number: Number(q) }] : []),
          { code: { contains: q, mode: "insensitive" as const } },
          { section: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } }
        ]
      : undefined;

    const stickers = await prisma.sticker.findMany({
      where: {
        albumId: resolvedAlbumId,
        ...(search ? { OR: search } : {})
      },
      orderBy: [{ code: "asc" }, { number: "asc" }],
      take: q ? 100 : 800
    });
    return json({ stickers });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return forbidden();
    return badRequest(error);
  }
}
