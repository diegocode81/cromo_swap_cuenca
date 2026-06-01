import { describe, expect, it } from "vitest";
import { buildSwapMatches, type SwapUserInput } from "@/lib/swap-matching";

const albumStickerIds = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"];

function sticker(id: string, number: number) {
  return { id, number, code: "GEN", name: `Cromo ${number}`, section: "General" };
}

function entry(stickerId: string, status: "HAVE" | "REPEATED" | "MISSING", quantity = 1) {
  return { stickerId, status, quantity, sticker: sticker(stickerId, Number(stickerId.slice(1))) };
}

function user(data: Partial<SwapUserInput> & { id: string; stickers?: SwapUserInput["stickers"] }): SwapUserInput {
  return {
    id: data.id,
    name: data.name ?? data.id,
    city: data.city ?? "Cuenca",
    stickers: data.stickers ?? []
  };
}

describe("buildSwapMatches", () => {
  it("does not show users from another city", () => {
    const currentUser = user({ id: "u1", city: "Cuenca", stickers: [entry("s1", "REPEATED")] });
    const candidate = user({ id: "u2", city: "Quito", stickers: [entry("s2", "REPEATED"), entry("s1", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches).toHaveLength(0);
  });

  it("does not show the current user as candidate", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "REPEATED"), entry("s2", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser], albumStickerIds });

    expect(matches).toHaveLength(0);
  });

  it("creates a 1 to 1 match", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "REPEATED"), entry("s2", "MISSING")] });
    const candidate = user({ id: "u2", stickers: [entry("s2", "REPEATED"), entry("s1", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches).toHaveLength(1);
    expect(matches[0].exchangeQuantity).toBe(1);
    expect(matches[0].youGive.map((item) => item.stickerId)).toEqual(["s1"]);
    expect(matches[0].youReceive.map((item) => item.stickerId)).toEqual(["s2"]);
  });

  it("limits a 3 to 5 opportunity to 3 stickers", () => {
    const currentUser = user({
      id: "u1",
      stickers: [entry("s1", "REPEATED"), entry("s2", "REPEATED"), entry("s3", "REPEATED")]
    });
    const candidate = user({
      id: "u2",
      stickers: [
        entry("s4", "REPEATED"),
        entry("s5", "REPEATED"),
        entry("s6", "REPEATED"),
        entry("s7", "REPEATED"),
        entry("s8", "REPEATED"),
        entry("s1", "MISSING"),
        entry("s2", "MISSING"),
        entry("s3", "MISSING")
      ]
    });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches[0].exchangeQuantity).toBe(3);
    expect(matches[0].youGive).toHaveLength(3);
    expect(matches[0].youReceive).toHaveLength(3);
  });

  it("limits a 1 to 4 opportunity to 1 sticker", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "REPEATED")] });
    const candidate = user({
      id: "u2",
      stickers: [entry("s4", "REPEATED"), entry("s5", "REPEATED"), entry("s6", "REPEATED"), entry("s7", "REPEATED"), entry("s1", "MISSING")]
    });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches[0].exchangeQuantity).toBe(1);
    expect(matches[0].youGive).toHaveLength(1);
    expect(matches[0].youReceive).toHaveLength(1);
  });

  it("does not match when there are no compatible missing stickers", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "REPEATED"), entry("s2", "HAVE")] });
    const candidate = user({ id: "u2", stickers: [entry("s3", "REPEATED"), entry("s1", "HAVE")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds: ["s1", "s2", "s3"] });

    expect(matches).toHaveLength(0);
  });

  it("does not match when there are no compatible repeated stickers", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "REPEATED")] });
    const candidate = user({ id: "u2", stickers: [entry("s2", "HAVE"), entry("s1", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches).toHaveLength(0);
  });

  it("throws a controlled error when the user has no city", () => {
    const currentUser = user({ id: "u1", city: "", stickers: [entry("s1", "REPEATED")] });

    expect(() => buildSwapMatches({ currentUser, candidates: [currentUser], albumStickerIds })).toThrow("USER_CITY_REQUIRED");
  });

  it("returns no matches when the user has no repeated stickers", () => {
    const currentUser = user({ id: "u1", stickers: [entry("s1", "HAVE")] });
    const candidate = user({ id: "u2", stickers: [entry("s2", "REPEATED"), entry("s1", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches).toHaveLength(0);
  });

  it("returns no matches when the user has no missing stickers", () => {
    const currentUser = user({ id: "u1", stickers: albumStickerIds.map((id) => entry(id, id === "s1" ? "REPEATED" : "HAVE")) });
    const candidate = user({ id: "u2", stickers: [entry("s2", "REPEATED"), entry("s1", "MISSING")] });

    const matches = buildSwapMatches({ currentUser, candidates: [currentUser, candidate], albumStickerIds });

    expect(matches).toHaveLength(0);
  });
});
