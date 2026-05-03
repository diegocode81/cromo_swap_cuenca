import bcrypt from "bcrypt";
import { requireAdmin } from "@/lib/auth";
import { badRequest, json } from "@/lib/http";
import { prisma, withPrismaRetry } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(8).max(80)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { password } = schema.parse(await request.json());
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withPrismaRetry(() =>
      prisma.user.update({
        where: { id: params.id },
        data: { passwordHash },
        select: { id: true, name: true, email: true, role: true, isActive: true }
      })
    );
    return json({ user });
  } catch (error) {
    console.error("[AdminUsers] password update failed", error);
    return badRequest(error);
  }
}
