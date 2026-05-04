import { runExchangeAgent } from "@/lib/exchange-agent";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

function hasValidSecret(request: Request) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${configured}`;
}

export async function GET(request: Request) {
  if (!hasValidSecret(request)) return forbidden();
  const result = await runExchangeAgent(prisma);
  console.log("[ExchangeAgent][cron]", result.logs.join(" "));
  return json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
