import { z } from "zod";
import { normalizeCityText } from "@/lib/city-catalog";
import { isValidPhone, normalizePhone } from "@/lib/phone";

const citySchema = z
  .string()
  .transform((value) => normalizeCityText(value))
  .refine((value) => value.length > 0, "La ciudad es obligatoria");

const phoneSchema = z
  .string()
  .refine((value) => value.length > 0, "El celular es obligatorio")
  .refine((value) => isValidPhone(value), "Ingresa un celular valido")
  .transform((value) => normalizePhone(value));

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160).toLowerCase(),
  password: z.string().min(8).max(80),
  city: citySchema,
  phone: phoneSchema
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(160).toLowerCase()
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8).max(80),
    confirmPassword: z.string().min(8).max(80)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"]
  });

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  city: citySchema,
  phone: phoneSchema
});

export const albumSchema = z
  .object({
    name: z.string().min(2).max(120),
    description: z.string().min(3).max(500),
    totalStickers: z.coerce.number().int().min(1).max(3000).optional(),
    sections: z
      .array(
        z.object({
          code: z.string().trim().min(2).max(8).transform((value) => value.toUpperCase()),
          name: z.string().trim().min(2).max(120),
          count: z.coerce.number().int().min(1).max(300)
        })
      )
      .min(1)
      .max(120)
      .optional()
  })
  .refine((data) => Boolean(data.totalStickers || data.sections?.length), {
    message: "Debes ingresar secciones o cantidad total de cromos",
    path: ["sections"]
  });

export const stickerSchema = z.object({
  albumId: z.string().optional(),
  number: z.coerce.number().int().positive(),
  code: z.string().trim().min(2).max(8).transform((value) => value.toUpperCase()).default("GEN"),
  section: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  rarity: z.string().max(40).optional().nullable()
});

export const userStickerSchema = z.object({
  stickerId: z.string(),
  status: z.enum(["HAVE", "REPEATED", "MISSING"]),
  quantity: z.coerce.number().int().min(1).max(99).default(1)
});

export const reportSchema = z.object({
  reportedUserId: z.string(),
  reason: z.string().min(5).max(1000)
});
