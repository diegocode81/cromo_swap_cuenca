import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";

export default async function DashboardPage() {
  const user = await requireUser();
  const activeAlbum = await prisma.album.findFirst({ where: { isActive: true } });
  const [registered, repeated, missing, matches, unreadMessages] = await Promise.all([
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id } }) : 0,
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "REPEATED" } }) : 0,
    activeAlbum ? prisma.userSticker.count({ where: { userId: user.id, albumId: activeAlbum.id, status: "MISSING" } }) : 0,
    activeAlbum
      ? prisma.exchangeMatch.count({ where: { albumId: activeAlbum.id, OR: [{ userAId: user.id }, { userBId: user.id }] } })
      : 0,
    prisma.message.count({
      where: { isRead: false, senderId: { not: user.id }, conversation: { OR: [{ userAId: user.id }, { userBId: user.id }] } }
    })
  ]);

  return (
    <section className="space-y-5">
      <div className="card bg-field text-white">
        <p className="text-sm opacity-90">Album activo</p>
        <h1 className="text-3xl font-black">{activeAlbum?.name ?? "Sin album activo"}</h1>
        <p className="mt-2 opacity-90">Hola, {user.name}. Gestiona tus cromos y revisa intercambios sugeridos.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Cromos registrados" value={registered} />
        <StatCard label="Repetidos" value={repeated} />
        <StatCard label="Faltantes" value={missing} />
        <StatCard label="Matches" value={matches} />
        <StatCard label="Mensajes pendientes" value={unreadMessages} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link className="btn-primary" href="/album">Registrar cromos</Link>
        <Link className="btn-secondary" href="/matches">Ver matches</Link>
        <Link className="btn-secondary" href="/chat">Abrir chat</Link>
      </div>
    </section>
  );
}
