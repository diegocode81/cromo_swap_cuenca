import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { badRequest, json, notFound } from "@/lib/http";
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
    if (Object.keys(rest).length === 0 && !password) {
      return json({ error: "No hay cambios para actualizar" }, { status: 400 });
    }

    if (data.isActive !== undefined) {
      const existingUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: { role: true }
      });

      if (!existingUser) {
        return notFound("Usuario no encontrado");
      }

      if (existingUser.role === "ADMIN") {
        return json({ error: "No se puede activar o desactivar un usuario administrador." }, { status: 400 });
      }
    }

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
    console.error("[AdminUsers] update failed", error);
    return badRequest(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (admin.id === params.id) {
      return json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        role: true,
        _count: { select: { stickers: true } }
      }
    });

    if (!user) {
      return notFound("Usuario no encontrado");
    }

    if (user.role === "ADMIN") {
      return json({ error: "No se pueden eliminar usuarios administradores." }, { status: 400 });
    }

    if (user._count.stickers > 0) {
      return json({ error: "Solo se pueden eliminar usuarios con 0 cromos." }, { status: 409 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch (error) {
    console.error("[AdminUsers] delete failed", error);
    return badRequest(error);
  }
}
