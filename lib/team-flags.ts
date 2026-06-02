const FALLBACK_FLAG = "🏳️";

const CODE_FLAGS: Record<string, string> = {
  ARG: "🇦🇷",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CUW: "🇨🇼",
  CZE: "🇨🇿",
  DE: "🇩🇪",
  ECU: "🇪🇨",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  HAI: "🇭🇹",
  JO: "🇯🇴",
  JOR: "🇯🇴",
  MEX: "🇲🇽",
  RSA: "🇿🇦",
  TR: "🇹🇷",
  TUR: "🇹🇷",
  URU: "🇺🇾",
  USA: "🇺🇸",
  ZA: "🇿🇦"
};

const NAME_FLAGS: Record<string, string> = {
  argentina: "🇦🇷",
  brasil: "🇧🇷",
  brazil: "🇧🇷",
  canada: "🇨🇦",
  curacao: "🇨🇼",
  czechia: "🇨🇿",
  ecuador: "🇪🇨",
  espana: "🇪🇸",
  spain: "🇪🇸",
  "estados unidos": "🇺🇸",
  france: "🇫🇷",
  francia: "🇫🇷",
  germany: "🇩🇪",
  haiti: "🇭🇹",
  jordan: "🇯🇴",
  mexico: "🇲🇽",
  "south africa": "🇿🇦",
  turkiye: "🇹🇷",
  turkey: "🇹🇷",
  "united states": "🇺🇸",
  uruguay: "🇺🇾"
};

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function flagFromIsoAlpha2(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return null;

  return Array.from(code)
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

export function getTeamFlag(teamName: string, teamCode?: string) {
  const normalizedCode = teamCode?.trim().toUpperCase();
  if (normalizedCode) {
    const codeFlag = CODE_FLAGS[normalizedCode] ?? flagFromIsoAlpha2(normalizedCode);
    if (codeFlag) return codeFlag;
  }

  return NAME_FLAGS[normalizeTeamName(teamName)] ?? FALLBACK_FLAG;
}
