import bcrypt from "bcrypt";
import { requireAdmin } from "@/lib/auth";
import { badRequest, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  password: z.string().min(8).max(80).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = schema.parse(await request.json());
    const { password, ...rest } = data;
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {})
      },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    return json({ user });
  } catch (error) {
    return badRequest(error);
  }
}
