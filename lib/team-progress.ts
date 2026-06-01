export type TeamStickerGroup = {
  code: string;
  section: string;
  totalStickers: number;
};

export type OwnedTeamSticker = {
  code: string;
  section: string;
};

export type TeamProgress = {
  code: string;
  name: string;
  flag: string | null;
  totalStickers: number;
  ownedStickers: number;
  isStarted: boolean;
  isCompleted: boolean;
};

const COUNTRY_FLAGS: Record<string, string> = {
  ARG: "🇦🇷",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  ECU: "🇪🇨",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  HAI: "🇭🇹",
  MEX: "🇲🇽",
  USA: "🇺🇸"
};

function teamKey(code: string, section: string) {
  return `${code}:${section}`;
}

export function isTeamSection(group: { code: string; section: string }) {
  return group.code.toUpperCase() !== "GEN" && group.section.trim().toLowerCase() !== "general";
}

export function buildTeamProgress({
  teams,
  ownedStickers
}: {
  teams: TeamStickerGroup[];
  ownedStickers: OwnedTeamSticker[];
}) {
  const ownedByTeam = new Map<string, number>();

  ownedStickers.filter(isTeamSection).forEach((sticker) => {
    const key = teamKey(sticker.code, sticker.section);
    ownedByTeam.set(key, (ownedByTeam.get(key) ?? 0) + 1);
  });

  const teamProgress = teams
    .filter(isTeamSection)
    .map((team) => {
      const ownedStickers = ownedByTeam.get(teamKey(team.code, team.section)) ?? 0;
      return {
        code: team.code,
        name: team.section,
        flag: COUNTRY_FLAGS[team.code.toUpperCase()] ?? null,
        totalStickers: team.totalStickers,
        ownedStickers,
        isStarted: ownedStickers > 0,
        isCompleted: ownedStickers >= team.totalStickers
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    teams: teamProgress,
    completedTeams: teamProgress.filter((team) => team.isCompleted),
    startedTeamsCount: teamProgress.filter((team) => team.isStarted).length,
    pendingTeamsCount: teamProgress.filter((team) => !team.isCompleted).length
  };
}
