import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const activeAlbum = await prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
  const [registered, repeated, missing, matches] = await Promise.all([
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id } }) : 0,
    activeAlbum
      ? prisma.userSticker
          .aggregate({ where: { userId: user.id, albumId: activeAlbum.id, status: "REPEATED" }, _sum: { quantity: true } })
          .then((result) => result._sum.quantity ?? 0)
      : 0,
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "MISSING" } }) : 0,
    activeAlbum
      ? prisma.exchangeMatch.count({ where: { albumId: activeAlbum.id, OR: [{ userAId: user.id }, { userBId: user.id }] } })
      : 0
  ]);
  const albumProgress = activeAlbum?.totalStickers ? Math.min(100, Math.round((registered / activeAlbum.totalStickers) * 100)) : 0;

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-soft">
        <div className="grid gap-0 md:grid-cols-[1.35fr_0.65fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-field px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                Album activo
              </span>
              {activeAlbum ? (
                <span className="rounded-full bg-sky px-3 py-1 text-xs font-bold text-field">
                  {activeAlbum.totalStickers} cromos
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-ink sm:text-4xl">
              {activeAlbum?.name ?? "Sin album activo"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {activeAlbum?.description ?? "Cuando se active un album, podras registrar tus cromos y encontrar intercambios sugeridos."}
            </p>
            <div className="mt-5 max-w-xl">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Tu avance</span>
                <span className="text-field">{albumProgress}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-field" style={{ width: `${albumProgress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {registered} de {activeAlbum?.totalStickers ?? 0} cromos registrados en este album.
              </p>
            </div>
          </div>
          <div className="border-t border-emerald-100 bg-[linear-gradient(135deg,#eaf6ff,#f3fbf4)] p-5 md:border-l md:border-t-0">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] rounded-md border border-white/80 bg-white/90 p-2 shadow-sm"
                >
                  <div className="h-2 w-8 rounded-full bg-field/80" />
                  <div className="mt-3 h-7 rounded bg-sky" />
                  <p className="mt-3 text-center text-[10px] font-black text-field">
                    {activeAlbum ? index + 1 : "--"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cromos registrados" value={registered} />
        <StatCard label="Repetidos" value={repeated} />
        <StatCard label="Faltantes" value={missing} />
        <StatCard label="Matches" value={matches} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link className="btn-primary" href="/album">Registrar cromos</Link>
        <Link className="btn-secondary" href="/matches">Ver matches</Link>
      </div>
    </section>
  );
}
