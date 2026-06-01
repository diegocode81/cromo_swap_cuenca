export type SwapStickerInput = {
  stickerId: string;
  status: "HAVE" | "REPEATED" | "MISSING";
  quantity: number;
  sticker: {
    id: string;
    number: number;
    code: string;
    name: string;
    section: string;
  };
};

export type SwapUserInput = {
  id: string;
  name: string;
  city: string | null;
  stickers: SwapStickerInput[];
};

export type SwapStickerMatch = {
  stickerId: string;
  stickerNumber: number;
  stickerCode: string;
  stickerName: string;
  section: string;
  quantity: number;
  availableQuantity: number;
};

export type SwapMatch = {
  userId: string;
  userName: string;
  city: string;
  exchangeQuantity: number;
  youGive: SwapStickerMatch[];
  youReceive: SwapStickerMatch[];
};

export type BuildSwapMatchesInput = {
  currentUser: SwapUserInput;
  candidates: SwapUserInput[];
  albumStickerIds: string[];
};

function isOwned(entry?: SwapStickerInput) {
  return entry?.status === "HAVE" || entry?.status === "REPEATED";
}

function repeatedOptions(user: SwapUserInput, receiverMissingIds: Set<string>) {
  return user.stickers
    .filter((entry) => entry.status === "REPEATED" && entry.quantity > 0 && receiverMissingIds.has(entry.stickerId))
    .map((entry) => ({
      stickerId: entry.stickerId,
      stickerNumber: entry.sticker.number,
      stickerCode: entry.sticker.code,
      stickerName: entry.sticker.name,
      section: entry.sticker.section,
      quantity: 1,
      availableQuantity: entry.quantity
    }))
    .sort((a, b) => a.stickerCode.localeCompare(b.stickerCode) || a.stickerNumber - b.stickerNumber);
}

function missingStickerIds(user: SwapUserInput, albumStickerIds: string[]) {
  const bySticker = new Map(user.stickers.map((entry) => [entry.stickerId, entry]));
  return new Set(albumStickerIds.filter((stickerId) => !isOwned(bySticker.get(stickerId))));
}

export function buildSwapMatches({ currentUser, candidates, albumStickerIds }: BuildSwapMatchesInput) {
  if (!currentUser.city?.trim()) {
    throw new Error("USER_CITY_REQUIRED");
  }

  const currentMissingIds = missingStickerIds(currentUser, albumStickerIds);
  const currentRepeatedCount = currentUser.stickers.filter((entry) => entry.status === "REPEATED" && entry.quantity > 0).length;

  if (currentRepeatedCount === 0 || currentMissingIds.size === 0) {
    return [];
  }

  return candidates
    .filter((candidate) => candidate.id !== currentUser.id)
    .filter((candidate) => candidate.city === currentUser.city)
    .map((candidate) => {
      const candidateMissingIds = missingStickerIds(candidate, albumStickerIds);
      const youGiveOptions = repeatedOptions(currentUser, candidateMissingIds);
      const youReceiveOptions = repeatedOptions(candidate, currentMissingIds);
      const exchangeQuantity = Math.min(youGiveOptions.length, youReceiveOptions.length);

      if (exchangeQuantity < 1) return null;

      return {
        userId: candidate.id,
        userName: candidate.name,
        city: candidate.city ?? "",
        exchangeQuantity,
        youGive: youGiveOptions.slice(0, exchangeQuantity),
        youReceive: youReceiveOptions.slice(0, exchangeQuantity)
      } satisfies SwapMatch;
    })
    .filter((match): match is SwapMatch => Boolean(match))
    .sort((a, b) => b.exchangeQuantity - a.exchangeQuantity || a.userName.localeCompare(b.userName));
}
