import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, json } from "@/lib/http";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return json({ error: "Ese email ya esta registrado" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        city: data.city,
        phone: data.phone
      },
      select: { id: true, name: true, email: true, city: true, phone: true }
    });

    return json({ user }, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
