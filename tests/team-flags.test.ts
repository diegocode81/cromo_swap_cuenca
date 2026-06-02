import { describe, expect, it } from "vitest";
import { getTeamFlag } from "@/lib/team-flags";

describe("getTeamFlag", () => {
  it("returns flags for supported team names", () => {
    expect(getTeamFlag("Curacao")).toBe("🇨🇼");
    expect(getTeamFlag("Czechia")).toBe("🇨🇿");
    expect(getTeamFlag("Germany")).toBe("🇩🇪");
    expect(getTeamFlag("Jordan")).toBe("🇯🇴");
    expect(getTeamFlag("South Africa")).toBe("🇿🇦");
    expect(getTeamFlag("Türkiye")).toBe("🇹🇷");
    expect(getTeamFlag("Uruguay")).toBe("🇺🇾");
  });

  it("normalizes case and accents", () => {
    expect(getTeamFlag("curaçao")).toBe("🇨🇼");
    expect(getTeamFlag("TURKIYE")).toBe("🇹🇷");
  });

  it("uses team code before team name when provided", () => {
    expect(getTeamFlag("Alemania", "GER")).toBe("🇩🇪");
    expect(getTeamFlag("Unknown", "JO")).toBe("🇯🇴");
  });

  it("returns a safe fallback for unknown teams", () => {
    expect(getTeamFlag("Equipo Inventado")).toBe("🏳️");
  });
});

