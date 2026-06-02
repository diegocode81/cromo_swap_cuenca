import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTeamProgress } from "@/lib/team-progress";

export default async function DashboardPage() {
  const user = await requireUser();
  const activeAlbum = await prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
  const [registered, repeated, missing, matches, stickerGroups, ownedTeamStickers] = await Promise.all([
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id } }) : 0,
    activeAlbum
      ? prisma.userSticker
          .aggregate({ where: { userId: user.id, albumId: activeAlbum.id, status: "REPEATED" }, _sum: { quantity: true } })
          .then((result) => result._sum.quantity ?? 0)
      : 0,
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "MISSING" } }) : 0,
    activeAlbum
      ? prisma.exchangeMatch.count({ where: { albumId: activeAlbum.id, OR: [{ userAId: user.id }, { userBId: user.id }] } })
      : 0,
    activeAlbum
      ? prisma.sticker.groupBy({
          by: ["code", "section"],
          where: { albumId: activeAlbum.id },
          _count: { _all: true }
        })
      : [],
    activeAlbum
      ? prisma.userSticker.findMany({
          where: { userId: user.id, albumId: activeAlbum.id, status: { in: ["HAVE", "REPEATED"] } },
          select: { sticker: { select: { code: true, section: true } } }
        })
      : []
  ]);
  const albumProgress = activeAlbum?.totalStickers ? Math.min(100, Math.round((registered / activeAlbum.totalStickers) * 100)) : 0;
  const teamProgress = buildTeamProgress({
    teams: stickerGroups.map((group) => ({
      code: group.code,
      section: group.section,
      totalStickers: group._count._all
    })),
    ownedStickers: ownedTeamStickers.map((entry) => entry.sticker)
  });

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
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardMetric label="Cromos registrados" value={registered} />
              <DashboardMetric label="Repetidos" value={repeated} />
              <DashboardMetric label="Faltantes" value={missing} />
              <DashboardMetric label="Matches" value={matches} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link className="btn-primary text-center" href="/album">Registrar cromos</Link>
              <Link className="btn-secondary text-center" href="/matches">Ver matches</Link>
            </div>
          </div>
          <div className="border-t border-emerald-100 bg-[linear-gradient(135deg,#eaf6ff,#f3fbf4)] p-5 md:border-l md:border-t-0">
            <div className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-field">🏆 Equipos completados</p>
                  <p className="mt-1 text-3xl font-black text-ink">{teamProgress.completedTeams.length}</p>
                </div>
                <span className="rounded-full bg-field px-3 py-1 text-xs font-black text-white">
                  Completos
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                  <p className="text-xs font-bold text-slate-600">Equipos iniciados</p>
                  <p className="text-xl font-black text-field">{teamProgress.startedTeamsCount}</p>
                </div>
                <div className="rounded-lg border border-sky/60 bg-sky/40 px-3 py-2">
                  <p className="text-xs font-bold text-slate-600">Equipos pendientes</p>
                  <p className="text-xl font-black text-field">{teamProgress.pendingTeamsCount}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-black text-ink">Lista completada</p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-field">
                    {teamProgress.completedTeams.length} / {teamProgress.teams.length}
                  </span>
                </div>
                {teamProgress.completedTeams.length > 0 ? (
                  <ul className="max-h-48 space-y-2 overflow-auto pr-1">
                    {teamProgress.completedTeams.map((team) => (
                      <li key={`${team.code}-${team.name}`} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2">
                        <span className="min-w-0 truncate text-sm font-bold text-ink">
                          <span className="mr-2">{team.flag ?? "🏁"}</span>
                          {team.name}
                        </span>
                        <span className="rounded-full bg-field px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          Completo
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600">
                    Aun no completas equipos. Registra todos los cromos de un equipo para verlo aqui.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3">
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-black text-field">{value}</p>
    </div>
  );
}
