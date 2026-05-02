import { requireUser } from "@/lib/auth";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireUser();
    const albums = await prisma.album.findMany({ orderBy: { createdAt: "desc" } });
    return json({ albums });
  } catch {
    return forbidden();
  }
}
