import { InventoryManager } from "@/components/inventory-manager";
import { requireUser } from "@/lib/auth";
import { getActiveAlbum } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function AlbumScreen({ defaultStatus }: { defaultStatus?: "HAVE" | "REPEATED" | "MISSING" }) {
  const user = await requireUser();
  const album = await getActiveAlbum();
  if (!album) {
    const draftAlbums = await prisma.album.findMany({
      where: { status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stickers: true } } }
    });

    return (
      <section className="space-y-4">
        <div className="card">
          <h1 className="text-3xl font-black">Sin album activo</h1>
          <p className="mt-2 text-slate-600">
            El administrador esta preparando el catalogo. Cuando active un album, podras registrar tus cromos aqui.
          </p>
        </div>
        {draftAlbums.length > 0 ? (
          <div className="card">
            <h2 className="text-xl font-black">Albumes en preparacion</h2>
            <div className="mt-3 grid gap-2">
              {draftAlbums.map((draftAlbum) => (
                <div key={draftAlbum.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-bold">{draftAlbum.name}</p>
                  <p className="text-sm text-slate-600">{draftAlbum._count.stickers} cromos cargados</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }
  const [stickers, entries, historicalAlbums] = await Promise.all([
    prisma.sticker.findMany({ where: { albumId: album.id }, orderBy: [{ code: "asc" }, { number: "asc" }] }),
    prisma.userSticker.findMany({ where: { userId: user.id, albumId: album.id }, include: { sticker: true } }),
    prisma.album.findMany({
      where: { status: { not: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { stickers: true, userStickers: true, matches: true } } }
    })
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">{album.name}</h1>
        <p className="text-slate-600">{album.description}</p>
      </div>
      <InventoryManager
        stickers={stickers.map((sticker) => ({
          id: sticker.id,
          number: sticker.number,
          code: sticker.code,
          name: sticker.name,
          section: sticker.section
        }))}
        initialEntries={entries.map((entry) => ({
          id: entry.id,
          status: entry.status,
          quantity: entry.quantity,
          sticker: {
            id: entry.sticker.id,
            number: entry.sticker.number,
            code: entry.sticker.code,
            name: entry.sticker.name,
            section: entry.sticker.section
          }
        }))}
        defaultStatus={defaultStatus}
      />
      {historicalAlbums.length > 0 ? (
        <div className="card">
          <h2 className="text-xl font-black">Albumes anteriores</h2>
          <p className="mb-3 text-sm text-slate-600">Historial en modo solo lectura.</p>
          <div className="grid gap-2">
            {historicalAlbums.map((oldAlbum) => (
              <div key={oldAlbum.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-bold">{oldAlbum.name}</p>
                <p className="text-sm text-slate-600">
                  {oldAlbum._count.stickers} cromos · {oldAlbum._count.userStickers} registros · {oldAlbum._count.matches} matches
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
