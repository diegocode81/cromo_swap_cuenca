import { AdminCityManager } from "@/components/admin-city-manager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCitiesPage() {
  await requireAdmin();
  const cities = await prisma.city.findMany({
    orderBy: [{ name: "asc" }, { province: "asc" }],
    select: { id: true, name: true, province: true, slug: true, isActive: true }
  });

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-black">Ciudades</h1>
        <p className="text-sm text-slate-600">
          Gestiona el catalogo de ciudades disponible para registro y perfil.
        </p>
      </div>
      <AdminCityManager cities={cities} />
    </section>
  );
}

