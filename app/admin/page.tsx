import Link from "next/link";
import { RestartSeasonForm, RunAgentButton } from "@/components/admin-actions";
import { StatCard } from "@/components/stat-card";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();
  const activeAlbum = await prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
  const [users, stickers, matches, reports] = await Promise.all([
    prisma.user.count(),
    prisma.userSticker.count(),
    prisma.exchangeMatch.count(),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } })
  ]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black">Panel administrador</h1>
          <p className="text-slate-600">Album activo para usuarios: {activeAlbum?.name ?? "Sin album activo"}</p>
        </div>
        <RunAgentButton />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios" value={users} />
        <StatCard label="Cromos registrados" value={stickers} />
        <StatCard label="Matches generados" value={matches} />
        <StatCard label="Reportes abiertos" value={reports} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link className="btn-secondary" href="/admin/users">Usuarios</Link>
        <Link className="btn-secondary" href="/admin/reports">Reportes</Link>
        <Link className="btn-secondary" href="/admin/albums">Albumes</Link>
      </div>
      <RestartSeasonForm />
    </section>
  );
}
