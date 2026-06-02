import { requireAdmin } from "@/lib/auth";
import { isCityCatalogUnavailableError } from "@/lib/city-catalog";
import { preserveExistingUserCities, seedCities } from "@/lib/city-seed";
import { forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? request.headers.get("x-cities-seed-token") ?? "";
}

async function authorizeSeed(request: Request) {
  const expectedToken = process.env.CITIES_SEED_TOKEN;
  const providedToken = getBearerToken(request);

  if (expectedToken && providedToken && providedToken === expectedToken) {
    return true;
  }

  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const isAuthorized = await authorizeSeed(request);
  if (!isAuthorized) return forbidden();

  try {
    const result = await seedCities(prisma);
    await preserveExistingUserCities(prisma);
    return json(result);
  } catch (error) {
    if (isCityCatalogUnavailableError(error)) {
      return json(
        { error: "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades antes del seed." },
        { status: 503 }
      );
    }

    console.error("[CitiesSeed] failed", error);
    return json({ error: "No se pudo ejecutar el seed de ciudades." }, { status: 500 });
  }
}

