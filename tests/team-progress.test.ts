import { describe, expect, it } from "vitest";
import { buildTeamProgress } from "@/lib/team-progress";

const teams = [
  { code: "ECU", section: "Ecuador", totalStickers: 3 },
  { code: "ARG", section: "Argentina", totalStickers: 2 },
  { code: "GEN", section: "General", totalStickers: 4 }
];

describe("buildTeamProgress", () => {
  it("returns zero progress when the user has no stickers", () => {
    const progress = buildTeamProgress({ teams, ownedStickers: [] });

    expect(progress.teams).toHaveLength(2);
    expect(progress.completedTeams).toHaveLength(0);
    expect(progress.startedTeamsCount).toBe(0);
    expect(progress.pendingTeamsCount).toBe(2);
  });

  it("counts started teams without marking partial teams as complete", () => {
    const progress = buildTeamProgress({
      teams,
      ownedStickers: [
        { code: "ECU", section: "Ecuador" },
        { code: "ARG", section: "Argentina" }
      ]
    });

    expect(progress.completedTeams).toHaveLength(0);
    expect(progress.startedTeamsCount).toBe(2);
    expect(progress.pendingTeamsCount).toBe(2);
  });

  it("marks a team as complete when all its stickers are owned", () => {
    const progress = buildTeamProgress({
      teams,
      ownedStickers: [
        { code: "ARG", section: "Argentina" },
        { code: "ARG", section: "Argentina" }
      ]
    });

    expect(progress.completedTeams).toEqual([
      expect.objectContaining({ code: "ARG", name: "Argentina", flag: "🇦🇷", isCompleted: true })
    ]);
    expect(progress.startedTeamsCount).toBe(1);
    expect(progress.pendingTeamsCount).toBe(1);
  });

  it("marks every team as complete when the album teams are complete", () => {
    const progress = buildTeamProgress({
      teams,
      ownedStickers: [
        { code: "ECU", section: "Ecuador" },
        { code: "ECU", section: "Ecuador" },
        { code: "ECU", section: "Ecuador" },
        { code: "ARG", section: "Argentina" },
        { code: "ARG", section: "Argentina" }
      ]
    });

    expect(progress.completedTeams).toHaveLength(2);
    expect(progress.startedTeamsCount).toBe(2);
    expect(progress.pendingTeamsCount).toBe(0);
  });
});
