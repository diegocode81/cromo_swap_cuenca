import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type CityOption = {
  id: string;
  name: string;
  province: string;
  slug: string;
};

export const INITIAL_CITIES = [
  { name: "Ambato", province: "Tungurahua" },
  { name: "Azogues", province: "Canar" },
  { name: "Babahoyo", province: "Los Rios" },
  { name: "Cayambe", province: "Pichincha" },
  { name: "Cuenca", province: "Azuay" },
  { name: "Daule", province: "Guayas" },
  { name: "Duran", province: "Guayas" },
  { name: "Esmeraldas", province: "Esmeraldas" },
  { name: "Guaranda", province: "Bolivar" },
  { name: "Guayaquil", province: "Guayas" },
  { name: "Ibarra", province: "Imbabura" },
  { name: "Latacunga", province: "Cotopaxi" },
  { name: "Loja", province: "Loja" },
  { name: "Machala", province: "El Oro" },
  { name: "Manta", province: "Manabi" },
  { name: "Milagro", province: "Guayas" },
  { name: "Otavalo", province: "Imbabura" },
  { name: "Portoviejo", province: "Manabi" },
  { name: "Quevedo", province: "Los Rios" },
  { name: "Quito", province: "Pichincha" },
  { name: "Riobamba", province: "Chimborazo" },
  { name: "Samborondon", province: "Guayas" },
  { name: "Santo Domingo", province: "Santo Domingo de los Tsachilas" },
  { name: "Tulcan", province: "Carchi" }
] as const;

export const cityInputSchema = z.object({
  name: z.string().transform(normalizeCityText).pipe(z.string().min(1, "La ciudad es obligatoria").max(80)),
  province: z.string().transform(normalizeCityText).pipe(z.string().min(1, "La provincia es obligatoria").max(80)),
  isActive: z.boolean().optional()
});

export function normalizeCityText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function toCitySlug(value: string) {
  return normalizeCityText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cityResponse(city: CityOption) {
  return {
    id: city.id,
    name: city.name,
    province: city.province,
    slug: city.slug
  };
}

export function isCityCatalogUnavailableError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "P2021" ||
    /table .*cities.* does not exist|relation .*cities.* does not exist|does not exist in the current database/i.test(message)
  );
}

export async function findActiveCityByValue(value: string) {
  const normalized = normalizeCityText(value);
  const slug = toCitySlug(normalized);

  return prisma.city
    .findFirst({
      where: {
        isActive: true,
        OR: [{ slug }, { name: { equals: normalized, mode: "insensitive" } }]
      },
      select: { id: true, name: true, province: true, slug: true }
    })
    .catch((error) => {
      if (isCityCatalogUnavailableError(error)) return null;
      throw error;
    });
}

export async function normalizeActiveCityValue(value: string) {
  const city = await findActiveCityByValue(value);
  return city?.name ?? null;
}
