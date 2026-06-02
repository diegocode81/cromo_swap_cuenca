import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type CityOption = {
  id: string;
  name: string;
  province: string;
  slug: string;
};

export type InitialCity = {
  name: string;
  province: string;
  slug?: string;
};

export const INITIAL_CITIES: InitialCity[] = [
  { name: "24 de Mayo", province: "Manabi" },
  { name: "Aguarico", province: "Orellana" },
  { name: "Alausi", province: "Chimborazo" },
  { name: "Alfredo Baquerizo Moreno", province: "Guayas" },
  { name: "Ambato", province: "Tungurahua" },
  { name: "Antonio Ante", province: "Imbabura" },
  { name: "Arajuno", province: "Pastaza" },
  { name: "Archidona", province: "Napo" },
  { name: "Arenillas", province: "El Oro" },
  { name: "Atacames", province: "Esmeraldas" },
  { name: "Atahualpa", province: "El Oro" },
  { name: "Azogues", province: "Canar" },
  { name: "Baba", province: "Los Rios" },
  { name: "Babahoyo", province: "Los Rios" },
  { name: "Balao", province: "Guayas" },
  { name: "Balsas", province: "El Oro" },
  { name: "Balzar", province: "Guayas" },
  { name: "Banos de Agua Santa", province: "Tungurahua" },
  { name: "Biblian", province: "Canar" },
  { name: "Bolivar", province: "Carchi", slug: "bolivar-carchi" },
  { name: "Bolivar", province: "Manabi", slug: "bolivar-manabi" },
  { name: "Buena Fe", province: "Los Rios" },
  { name: "Caluma", province: "Bolivar" },
  { name: "Calvas", province: "Loja" },
  { name: "Camilo Ponce Enriquez", province: "Azuay" },
  { name: "Carlos Julio Arosemena Tola", province: "Napo" },
  { name: "Cascales", province: "Sucumbios" },
  { name: "Catamayo", province: "Loja" },
  { name: "Cayambe", province: "Pichincha" },
  { name: "Canar", province: "Canar" },
  { name: "Celica", province: "Loja" },
  { name: "Centinela del Condor", province: "Zamora Chinchipe" },
  { name: "Cevallos", province: "Tungurahua" },
  { name: "Chaguarpamba", province: "Loja" },
  { name: "Chambo", province: "Chimborazo" },
  { name: "Chilla", province: "El Oro" },
  { name: "Chillanes", province: "Bolivar" },
  { name: "Chimbo", province: "Bolivar" },
  { name: "Chinchipe", province: "Zamora Chinchipe" },
  { name: "Chone", province: "Manabi" },
  { name: "Chordeleg", province: "Azuay" },
  { name: "Chunchi", province: "Chimborazo" },
  { name: "Colimes", province: "Guayas" },
  { name: "Colta", province: "Chimborazo" },
  { name: "Coronel Marcelino Mariduena", province: "Guayas" },
  { name: "Cotacachi", province: "Imbabura" },
  { name: "Cuenca", province: "Azuay" },
  { name: "Cumanda", province: "Chimborazo" },
  { name: "Cuyabeno", province: "Sucumbios" },
  { name: "Daule", province: "Guayas" },
  { name: "Quito", province: "Pichincha" },
  { name: "Duran", province: "Guayas" },
  { name: "Deleg", province: "Canar" },
  { name: "Echeandia", province: "Bolivar" },
  { name: "El Carmen", province: "Manabi" },
  { name: "El Chaco", province: "Napo" },
  { name: "El Empalme", province: "Guayas" },
  { name: "El Guabo", province: "El Oro" },
  { name: "El Pan", province: "Azuay" },
  { name: "El Pangui", province: "Zamora Chinchipe" },
  { name: "El Tambo", province: "Canar" },
  { name: "El Triunfo", province: "Guayas" },
  { name: "Eloy Alfaro", province: "Esmeraldas" },
  { name: "Esmeraldas", province: "Esmeraldas" },
  { name: "Espejo", province: "Carchi" },
  { name: "Espindola", province: "Loja" },
  { name: "Flavio Alfaro", province: "Manabi" },
  { name: "Francisco de Orellana", province: "Orellana" },
  { name: "General Antonio Elizalde", province: "Guayas" },
  { name: "Giron", province: "Azuay" },
  { name: "Gonzalo Pizarro", province: "Sucumbios" },
  { name: "Gonzanama", province: "Loja" },
  { name: "Guachapala", province: "Azuay" },
  { name: "Gualaceo", province: "Azuay" },
  { name: "Gualaquiza", province: "Morona Santiago" },
  { name: "Guamote", province: "Chimborazo" },
  { name: "Guano", province: "Chimborazo" },
  { name: "Guaranda", province: "Bolivar" },
  { name: "Guayaquil", province: "Guayas" },
  { name: "Huamboya", province: "Morona Santiago" },
  { name: "Huaquillas", province: "El Oro" },
  { name: "Ibarra", province: "Imbabura" },
  { name: "Isabela", province: "Galapagos" },
  { name: "Isidro Ayora", province: "Guayas" },
  { name: "Jama", province: "Manabi" },
  { name: "Jaramijo", province: "Manabi" },
  { name: "Jipijapa", province: "Manabi" },
  { name: "Junin", province: "Manabi" },
  { name: "La Concordia", province: "Santo Domingo de los Tsachilas" },
  { name: "La Joya de los Sachas", province: "Orellana" },
  { name: "La Libertad", province: "Santa Elena" },
  { name: "La Mana", province: "Cotopaxi" },
  { name: "La Troncal", province: "Canar" },
  { name: "Nueva Loja", province: "Sucumbios" },
  { name: "Las Lajas", province: "El Oro" },
  { name: "Las Naves", province: "Bolivar" },
  { name: "Latacunga", province: "Cotopaxi" },
  { name: "Limon Indanza", province: "Morona Santiago" },
  { name: "Logrono", province: "Morona Santiago" },
  { name: "Loja", province: "Loja" },
  { name: "Lomas de Sargentillo", province: "Guayas" },
  { name: "Loreto", province: "Orellana" },
  { name: "Macara", province: "Loja" },
  { name: "Machala", province: "El Oro" },
  { name: "Manta", province: "Manabi" },
  { name: "Marcabeli", province: "El Oro" },
  { name: "Mejia", province: "Pichincha" },
  { name: "Mera", province: "Pastaza" },
  { name: "Milagro", province: "Guayas" },
  { name: "Mira", province: "Carchi" },
  { name: "Mocache", province: "Los Rios" },
  { name: "Mocha", province: "Tungurahua" },
  { name: "Montalvo", province: "Los Rios" },
  { name: "Montecristi", province: "Manabi" },
  { name: "Montufar", province: "Carchi" },
  { name: "Macas", province: "Morona Santiago" },
  { name: "Muisne", province: "Esmeraldas" },
  { name: "Nabon", province: "Azuay" },
  { name: "Nangaritza", province: "Zamora Chinchipe" },
  { name: "Naranjal", province: "Guayas" },
  { name: "Naranjito", province: "Guayas" },
  { name: "Nobol", province: "Guayas" },
  { name: "Olmedo", province: "Loja", slug: "olmedo-loja" },
  { name: "Olmedo", province: "Manabi", slug: "olmedo-manabi" },
  { name: "Otavalo", province: "Imbabura" },
  { name: "Ona", province: "Azuay" },
  { name: "Pablo Sexto", province: "Morona Santiago" },
  { name: "Pajan", province: "Manabi" },
  { name: "Palanda", province: "Zamora Chinchipe" },
  { name: "Palenque", province: "Los Rios" },
  { name: "Palestina", province: "Guayas" },
  { name: "Pallatanga", province: "Chimborazo" },
  { name: "Palora", province: "Morona Santiago" },
  { name: "Paltas", province: "Loja" },
  { name: "Pangua", province: "Cotopaxi" },
  { name: "Paquisha", province: "Zamora Chinchipe" },
  { name: "Pasaje", province: "El Oro" },
  { name: "Puyo", province: "Pastaza" },
  { name: "Patate", province: "Tungurahua" },
  { name: "Paute", province: "Azuay" },
  { name: "Pedernales", province: "Manabi" },
  { name: "Pedro Carbo", province: "Guayas" },
  { name: "Pedro Moncayo", province: "Pichincha" },
  { name: "Pedro Vicente Maldonado", province: "Pichincha" },
  { name: "Penipe", province: "Chimborazo" },
  { name: "Pichincha", province: "Manabi" },
  { name: "Pimampiro", province: "Imbabura" },
  { name: "Pindal", province: "Loja" },
  { name: "Pinas", province: "El Oro" },
  { name: "Playas", province: "Guayas" },
  { name: "Portovelo", province: "El Oro" },
  { name: "Portoviejo", province: "Manabi" },
  { name: "Pucara", province: "Azuay" },
  { name: "Puebloviejo", province: "Los Rios" },
  { name: "Puerto Lopez", province: "Manabi" },
  { name: "Puerto Quito", province: "Pichincha" },
  { name: "Pujili", province: "Cotopaxi" },
  { name: "Putumayo", province: "Sucumbios" },
  { name: "Puyango", province: "Loja" },
  { name: "Quero", province: "Tungurahua" },
  { name: "Quevedo", province: "Los Rios" },
  { name: "Quijos", province: "Napo" },
  { name: "Quilanga", province: "Loja" },
  { name: "Quininde", province: "Esmeraldas" },
  { name: "Quinsaloma", province: "Los Rios" },
  { name: "Riobamba", province: "Chimborazo" },
  { name: "Rioverde", province: "Esmeraldas" },
  { name: "Rocafuerte", province: "Manabi" },
  { name: "Ruminahui", province: "Pichincha" },
  { name: "Salcedo", province: "Cotopaxi" },
  { name: "Salinas", province: "Santa Elena" },
  { name: "Salitre", province: "Guayas" },
  { name: "Samborondon", province: "Guayas" },
  { name: "Puerto Baquerizo Moreno", province: "Galapagos" },
  { name: "San Fernando", province: "Azuay" },
  { name: "San Jacinto de Yaguachi", province: "Guayas" },
  { name: "San Juan Bosco", province: "Morona Santiago" },
  { name: "San Lorenzo", province: "Esmeraldas" },
  { name: "San Miguel", province: "Bolivar" },
  { name: "San Miguel de Urcuqui", province: "Imbabura" },
  { name: "San Miguel de los Bancos", province: "Pichincha" },
  { name: "San Pedro de Huaca", province: "Carchi" },
  { name: "San Pedro de Pelileo", province: "Tungurahua" },
  { name: "San Vicente", province: "Manabi" },
  { name: "Santa Ana", province: "Manabi" },
  { name: "Santa Clara", province: "Pastaza" },
  { name: "Santa Cruz", province: "Galapagos" },
  { name: "Santa Elena", province: "Santa Elena" },
  { name: "Santa Isabel", province: "Azuay" },
  { name: "Santa Lucia", province: "Guayas" },
  { name: "Santa Rosa", province: "El Oro" },
  { name: "Santiago", province: "Morona Santiago" },
  { name: "Santiago de Pillaro", province: "Tungurahua" },
  { name: "Santo Domingo", province: "Santo Domingo de los Tsachilas" },
  { name: "Saquisili", province: "Cotopaxi" },
  { name: "Saraguro", province: "Loja" },
  { name: "Sevilla de Oro", province: "Azuay" },
  { name: "Shushufindi", province: "Sucumbios" },
  { name: "Sigchos", province: "Cotopaxi" },
  { name: "Simon Bolivar", province: "Guayas" },
  { name: "Sozoranga", province: "Loja" },
  { name: "Sucre", province: "Manabi" },
  { name: "Sucumbios", province: "Sucumbios" },
  { name: "Sucua", province: "Morona Santiago" },
  { name: "Suscal", province: "Canar" },
  { name: "Sigsig", province: "Azuay" },
  { name: "Taisha", province: "Morona Santiago" },
  { name: "Tena", province: "Napo" },
  { name: "Tisaleo", province: "Tungurahua" },
  { name: "Tiwintza", province: "Morona Santiago" },
  { name: "Tosagua", province: "Manabi" },
  { name: "Tulcan", province: "Carchi" },
  { name: "Urdaneta", province: "Los Rios" },
  { name: "Valencia", province: "Los Rios" },
  { name: "Ventanas", province: "Los Rios" },
  { name: "Vinces", province: "Los Rios" },
  { name: "Yacuambi", province: "Zamora Chinchipe" },
  { name: "Yantzaza", province: "Zamora Chinchipe" },
  { name: "Zamora", province: "Zamora Chinchipe" },
  { name: "Zapotillo", province: "Loja" },
  { name: "Zaruma", province: "El Oro" }
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
