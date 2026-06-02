import { AdminCityManager } from "@/components/admin-city-manager";
import { requireAdmin } from "@/lib/auth";
import { isCityCatalogUnavailableError } from "@/lib/city-catalog";
import { prisma } from "@/lib/prisma";

export default async function AdminCitiesPage() {
  await requireAdmin();
  let catalogError = "";
  const cities = await prisma.city
    .findMany({
      orderBy: [{ name: "asc" }, { province: "asc" }],
      select: { id: true, name: true, province: true, slug: true, isActive: true }
    })
    .catch((error) => {
      if (isCityCatalogUnavailableError(error)) {
        catalogError =
          "El catalogo de ciudades no esta disponible. Aplica la migracion de ciudades y ejecuta el seed inicial.";
        return [];
      }

      console.error("[AdminCitiesPage] failed to load cities", error);
      catalogError = "No se pudo cargar el catalogo de ciudades. Intenta nuevamente en unos minutos.";
      return [];
    });

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Ciudades</h1>
        <p className="text-sm text-slate-600">
          Gestiona el catalogo de ciudades disponible para registro y perfil.
        </p>
      </div>
      <AdminCityManager cities={cities} initialError={catalogError} />
    </section>
  );
}
