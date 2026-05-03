import { MatchesList } from "@/components/matches-list";
import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export default async function MatchesPage() {
  const user = await requireUser();
  const album = await requireActiveAlbum();
  const matches = await prisma.exchangeMatch.findMany({
    where: { albumId: album.id, status: "SUGGESTED", OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      album: { select: { name: true } },
      userA: { select: { id: true, name: true, city: true } },
      userB: { select: { id: true, name: true, city: true } }
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }]
  });
  const viewMatches = matches.map((match) => ({
    ...match,
    stickersFromAToB: match.stickersFromAToB as never,
    stickersFromBToA: match.stickersFromBToA as never
  }));

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Intercambios sugeridos</h1>
        <p className="text-slate-600">Solo se muestran matches del album activo y sin datos sensibles.</p>
      </div>
      <MatchesList matches={viewMatches} currentUserId={user.id} />
    </section>
  );
}
