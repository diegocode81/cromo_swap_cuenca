import { requireAdmin } from "@/lib/auth";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        zone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { stickers: true, messages: true, reportsGot: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return json({ users });
  } catch {
    return forbidden();
  }
}
