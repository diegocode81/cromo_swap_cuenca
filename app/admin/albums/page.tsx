import { DeleteAlbumButton, EditAlbumForm, RestartSeasonForm, ToggleAlbumButton } from "@/components/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAlbumsPage() {
  await requireAdmin();
  const albums = await prisma.album.findMany({
    include: {
      stickers: { select: { code: true, section: true }, orderBy: [{ code: "asc" }, { number: "asc" }] },
      _count: { select: { stickers: true, matches: true, userStickers: true, conversations: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const viewAlbums = albums.map((album) => {
    const sectionCounts = new Map<string, { code: string; section: string; count: number }>();
    album.stickers.forEach((sticker) => {
      const key = `${sticker.code}:${sticker.section}`;
      const current = sectionCounts.get(key) ?? { code: sticker.code, section: sticker.section, count: 0 };
      current.count += 1;
      sectionCounts.set(key, current);
    });

    return {
      ...album,
      isEffectivelyActive: album.status === "ACTIVE" && album.isActive,
      hasCommunityData: album._count.userStickers + album._count.matches + album._count.conversations > 0,
      sectionsText: Array.from(sectionCounts.values())
        .map((section) => `${section.code},${section.section},${section.count}`)
        .join("\n")
    };
  });

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-black">Albumes</h1>
      <RestartSeasonForm />
      <div className="grid gap-3">
        {viewAlbums.map((album) => (
          <article key={album.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{album.name}</h2>
                <p className="text-sm text-slate-600">{album.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${album.isEffectivelyActive ? "bg-field text-white" : "bg-slate-100"}`}>
                {album.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {album.totalStickers} cromos · {album._count.matches} matches · {album._count.userStickers} registros
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleAlbumButton albumId={album.id} isActive={album.isEffectivelyActive} />
              <DeleteAlbumButton albumId={album.id} albumName={album.name} />
            </div>
            <EditAlbumForm
              album={{
                id: album.id,
                name: album.name,
                description: album.description,
                status: album.status,
                totalStickers: album.totalStickers,
                sectionsText: album.sectionsText,
                hasCommunityData: album.hasCommunityData,
                canRegenerateCatalog: album.status === "DRAFT" || !album.hasCommunityData
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
