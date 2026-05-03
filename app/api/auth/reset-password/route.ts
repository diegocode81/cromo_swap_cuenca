import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { badRequest, json } from "@/lib/http";
import { hashResetToken } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const data = resetPasswordSchema.parse(await request.json());
    const tokenHash = hashResetToken(data.token);
    const now = new Date();

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now || !resetToken.user.isActive) {
      return json({ error: "El enlace no es valido o expiro." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now }
      })
    ]);

    return json({ message: "Contrasena actualizada correctamente." });
  } catch (error) {
    return badRequest(error);
  }
}
