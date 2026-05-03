import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { badRequest, json } from "@/lib/http";
import {
  createResetToken,
  getPasswordResetUrl,
  hashResetToken,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  sendPasswordResetEmail
} from "@/lib/password-reset";

export async function POST(request: Request) {
  try {
    const data = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (user?.isActive) {
      const token = createResetToken();
      const tokenHash = hashResetToken(token);
      const now = new Date();

      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
          data: { usedAt: now }
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(now.getTime() + 60 * 60 * 1000)
          }
        })
      ]);

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: getPasswordResetUrl(token, request)
      });
    }

    return json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  } catch (error) {
    return badRequest(error);
  }
}
