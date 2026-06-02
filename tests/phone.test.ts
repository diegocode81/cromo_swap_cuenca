import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppUrl, normalizePhone, toWhatsAppPhone } from "@/lib/phone";
import { profileSchema, registerSchema } from "@/lib/validators";

const validRegisterInput = {
  name: "Usuario Prueba",
  email: "user@example.com",
  password: "password123",
  city: "Cuenca",
  phone: "098 765 4321"
};

describe("phone validation", () => {
  it("allows registration with a valid phone", () => {
    const parsed = registerSchema.parse(validRegisterInput);

    expect(parsed.phone).toBe("0987654321");
  });

  it("does not allow registration without phone", () => {
    expect(() => registerSchema.parse({ ...validRegisterInput, phone: "" })).toThrow();
  });

  it("does not allow invalid phone characters", () => {
    expect(() => registerSchema.parse({ ...validRegisterInput, phone: "098+7654321" })).toThrow();
    expect(() => registerSchema.parse({ ...validRegisterInput, phone: "098765abcd" })).toThrow();
  });

  it("allows profile phone updates", () => {
    const parsed = profileSchema.parse({ name: "Usuario Prueba", city: "Cuenca", phone: "+593 987-654-321" });

    expect(parsed.phone).toBe("+593987654321");
  });

  it("normalizes phone formatting", () => {
    expect(normalizePhone("(098) 765-4321")).toBe("0987654321");
  });
});

describe("WhatsApp links", () => {
  const youGive = [{ stickerCode: "ALG", stickerNumber: 1 }];
  const youReceive = [{ stickerCode: "ALG", stickerNumber: 4 }];

  it("converts a local Ecuadorian phone to wa.me format", () => {
    expect(toWhatsAppPhone("0987654321")).toBe("593987654321");
  });

  it("keeps an international phone in wa.me format", () => {
    expect(toWhatsAppPhone("+593987654321")).toBe("593987654321");
  });

  it("builds a WhatsApp message with stickers given and received", () => {
    const message = buildWhatsAppMessage({ youGive, youReceive });

    expect(message).toContain("CromoSwap Ecuador");
    expect(message).toContain("ALG 1");
    expect(message).toContain("ALG 4");
  });

  it("builds a WhatsApp URL with encoded message", () => {
    const url = buildWhatsAppUrl({ phone: "0987654321", youGive, youReceive });

    expect(url).toContain("https://wa.me/593987654321?text=");
    expect(url).toContain("ALG%201");
    expect(url).toContain("ALG%204");
  });

  it("returns null when there is no phone", () => {
    expect(buildWhatsAppUrl({ phone: null, youGive, youReceive })).toBeNull();
  });
});
