import { requireAdmin } from "@/lib/auth";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const matches = await prisma.exchangeMatch.findMany({
      include: { album: true, userA: { select: { name: true } }, userB: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200
    });
    return json({ matches });
  } catch {
    return forbidden();
  }
}
