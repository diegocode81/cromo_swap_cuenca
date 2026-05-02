import { describe, expect, it } from "vitest";
import { runExchangeAgent } from "@/lib/exchange-agent";

describe("ExchangeAgent", () => {
  it("stops when there is no active album", async () => {
    const prisma = {
      album: { findFirst: async () => null }
    };

    const result = await runExchangeAgent(prisma as never);
    expect(result.albumId).toBeNull();
    expect(result.generatedMatches).toBe(0);
    expect(result.logs[0]).toContain("No active album");
  });
});
