import { requireAdmin } from "@/lib/auth";
import { cityInputSchema, isCityCatalogUnavailableError, toCitySlug } from "@/lib/city-catalog";
import { badRequest, forbidden, json, notFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const data = cityInputSchema.partial().parse(await request.json());

    if (Object.keys(data).length === 0) {
      return json({ error: "No hay cambios para actualizar." }, { status: 400 });
    }

    const current = await prisma.city.findUnique({ where: { id: params.id } });
    if (!current) return notFound("Ciudad no encontrada");

    const nextName = data.name ?? current.name;
    const nextProvince = data.province ?? current.province;
    const nextSlug = data.name ? toCitySlug(data.name) : current.slug;

    const duplicate = await prisma.city.findFirst({
      where: {
        id: { not: params.id },
        OR: [
          { slug: nextSlug },
          {
            name: { equals: nextName, mode: "insensitive" },
            province: { equals: nextProvince, mode: "insensitive" }
          }
        ]
      }
    });

    if (duplicate) {
      return json({ error: "Ya existe una ciudad con ese nombre y provincia." }, { status: 409 });
    }

    const city = await prisma.city.update({
      where: { id: params.id },
      data: {
        ...(data.name ? { name: data.name, slug: nextSlug } : {}),
        ...(data.province ? { province: data.province } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
      }
    });

    return json({ city });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "UNAUTHORIZED"].includes(error.message)) return forbidden();
    if (isCityCatalogUnavailableError(error)) {
      return json({ error: "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades." }, { status: 503 });
    }
    return badRequest(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const city = await prisma.city.findUnique({ where: { id: params.id } });
    if (!city) return notFound("Ciudad no encontrada");

    const users = await prisma.user.count({ where: { city: { equals: city.name, mode: "insensitive" } } });
    if (users > 0) {
      return json(
        { error: "No se puede eliminar esta ciudad porque existen usuarios asociados." },
        { status: 409 }
      );
    }

    await prisma.city.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch (error) {
    if (error instanceof Error && ["FORBIDDEN", "UNAUTHORIZED"].includes(error.message)) return forbidden();
    if (isCityCatalogUnavailableError(error)) {
      return json({ error: "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades." }, { status: 503 });
    }
    return badRequest(error);
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  return PATCH(request, context);
}
