import { z } from "zod";
import { CITY, CUENCA_ZONES } from "@/lib/zones";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160).toLowerCase(),
  password: z.string().min(8).max(80),
  city: z.literal(CITY),
  zone: z.enum(CUENCA_ZONES)
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  zone: z.enum(CUENCA_ZONES)
});

export const albumSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(3).max(500),
  totalStickers: z.coerce.number().int().min(1).max(2000)
});

export const stickerSchema = z.object({
  albumId: z.string().optional(),
  number: z.coerce.number().int().positive(),
  section: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  rarity: z.string().max(40).optional().nullable()
});

export const userStickerSchema = z.object({
  stickerId: z.string(),
  status: z.enum(["HAVE", "REPEATED", "MISSING"]),
  quantity: z.coerce.number().int().min(1).max(99).default(1)
});

export const conversationSchema = z.object({
  userId: z.string().optional(),
  exchangeMatchId: z.string().optional()
});

export const messageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(1000)
});

export const reportSchema = z.object({
  reportedUserId: z.string(),
  conversationId: z.string().optional(),
  reason: z.string().min(5).max(1000)
});
