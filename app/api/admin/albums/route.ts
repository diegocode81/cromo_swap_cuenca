import { requireAdmin } from "@/lib/auth";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { albumSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stickers: true, matches: true, userStickers: true } } }
    });
    return json({ albums });
  } catch {
    return forbidden();
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = albumSchema.parse(await request.json());
    const album = await prisma.album.create({ data: { ...data, isActive: false } });
    return json({ album }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
