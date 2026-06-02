import { requireAdmin } from "@/lib/auth";
import { cityInputSchema, cityResponse, isCityCatalogUnavailableError, toCitySlug } from "@/lib/city-catalog";
import { badRequest, forbidden, json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const cities = await prisma.city.findMany({
      orderBy: [{ name: "asc" }, { province: "asc" }],
      select: { id: true, name: true, province: true, slug: true, isActive: true }
    });

    return json(cities);
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "UNAUTHORIZED"].includes(error.message)) return forbidden();
    if (isCityCatalogUnavailableError(error)) {
      return json({ error: "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades." }, { status: 503 });
    }
    return badRequest(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = cityInputSchema.parse(await request.json());
    const slug = toCitySlug(data.name);

    const existing = await prisma.city.findFirst({
      where: {
        OR: [
          { slug },
          {
            name: { equals: data.name, mode: "insensitive" },
            province: { equals: data.province, mode: "insensitive" }
          }
        ]
      }
    });

    if (existing) {
      return json({ error: "Ya existe una ciudad con ese nombre y provincia." }, { status: 409 });
    }

    const city = await prisma.city.create({
      data: {
        name: data.name,
        province: data.province,
        slug,
        isActive: data.isActive ?? true
      },
      select: { id: true, name: true, province: true, slug: true }
    });

    return json({ city: cityResponse(city) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "UNAUTHORIZED"].includes(error.message)) return forbidden();
    if (isCityCatalogUnavailableError(error)) {
      return json({ error: "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades." }, { status: 503 });
    }
    return badRequest(error);
  }
}
