const PHONE_ALLOWED_PATTERN = /^\+?[0-9\-\s()]+$/;

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const compact = trimmed.replace(/[\s\-()]/g, "");
  return hasPlus ? `+${compact.replace(/\+/g, "")}` : compact.replace(/\+/g, "");
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  const normalized = normalizePhone(trimmed);
  return trimmed.length > 0 && PHONE_ALLOWED_PATTERN.test(trimmed) && normalized.length >= 9 && normalized.length <= 16;
}

export function toWhatsAppPhone(value: string | null | undefined) {
  if (!value) return null;
  const normalized = normalizePhone(value).replace(/^\+/, "");

  if (!/^\d{9,15}$/.test(normalized)) return null;

  if (normalized.startsWith("0") && normalized.length === 10) {
    return `593${normalized.slice(1)}`;
  }

  return normalized;
}

function stickerLabel(sticker: { stickerCode: string; stickerNumber: number }) {
  return `${sticker.stickerCode} ${sticker.stickerNumber}`;
}

export function buildWhatsAppMessage({
  youGive,
  youReceive
}: {
  youGive: { stickerCode: string; stickerNumber: number }[];
  youReceive: { stickerCode: string; stickerNumber: number }[];
}) {
  const giveText = youGive.map(stickerLabel).join(", ");
  const receiveText = youReceive.map(stickerLabel).join(", ");
  return `Hola, vi en CromoSwap que podemos intercambiar cromos. Yo puedo entregarte ${giveText} y me interesaria recibir ${receiveText}.`;
}

export function buildWhatsAppUrl({
  phone,
  youGive,
  youReceive
}: {
  phone: string | null | undefined;
  youGive: { stickerCode: string; stickerNumber: number }[];
  youReceive: { stickerCode: string; stickerNumber: number }[];
}) {
  const waPhone = toWhatsAppPhone(phone);
  if (!waPhone) return null;
  const text = encodeURIComponent(buildWhatsAppMessage({ youGive, youReceive }));
  return `https://wa.me/${waPhone}?text=${text}`;
}
