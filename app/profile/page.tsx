import { ProfileForm } from "@/components/profile-form";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireUser();
  const album = await prisma.album.findFirst({ where: { isActive: true, status: "ACTIVE" } });
  const [registered, repeated, missing, matches] = await Promise.all([
    album ? prisma.userSticker.count({ where: { userId: user.id, albumId: album.id } }) : 0,
    album
      ? prisma.userSticker
          .aggregate({ where: { userId: user.id, albumId: album.id, status: "REPEATED" }, _sum: { quantity: true } })
          .then((result) => result._sum.quantity ?? 0)
      : 0,
    album ? prisma.userSticker.count({ where: { userId: user.id, albumId: album.id, status: "MISSING" } }) : 0,
    album ? prisma.exchangeMatch.count({ where: { albumId: album.id, OR: [{ userAId: user.id }, { userBId: user.id }] } }) : 0
  ]);

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-black">Perfil</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cromos registrados" value={registered} />
        <StatCard label="Repetidos" value={repeated} />
        <StatCard label="Faltantes" value={missing} />
        <StatCard label="Matches" value={matches} />
      </div>
      <ProfileForm user={{ name: user.name, email: user.email, city: user.city, phone: user.phone }} />
    </section>
  );
}
