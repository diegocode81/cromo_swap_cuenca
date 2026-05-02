import { requireAdmin } from "@/lib/auth";
import { runExchangeAgent } from "@/lib/exchange-agent";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await requireAdmin();
    const result = await runExchangeAgent(prisma);
    console.log("[ExchangeAgent][manual]", result.logs.join(" "));
    return json(result);
  } catch {
    return forbidden();
  }
}
