import { DeleteAlbumButton, RestartSeasonForm, ToggleAlbumButton } from "@/components/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAlbumsPage() {
  await requireAdmin();
  const albums = await prisma.album.findMany({
    include: { _count: { select: { stickers: true, matches: true, userStickers: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-black">Albumes</h1>
      <RestartSeasonForm />
      <div className="grid gap-3">
        {albums.map((album) => (
          <article key={album.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{album.name}</h2>
                <p className="text-sm text-slate-600">{album.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${album.isActive ? "bg-field text-white" : "bg-slate-100"}`}>
                {album.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {album.totalStickers} cromos · {album._count.matches} matches · {album._count.userStickers} registros
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleAlbumButton albumId={album.id} isActive={album.isActive} />
              <DeleteAlbumButton albumId={album.id} albumName={album.name} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
