import { requireAdmin } from "@/lib/auth";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        reportedUser: { select: { id: true, name: true, email: true, isActive: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return json({ reports });
  } catch {
    return forbidden();
  }
}
