import { SwapMatchesPanel } from "@/components/swap-matches-panel";
import { requireUser } from "@/lib/auth";
import { requireActiveAlbum } from "@/lib/domain";

export default async function MatchesPage() {
  const user = await requireUser();
  const album = await requireActiveAlbum();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Intercambios</h1>
        <p className="text-slate-600">
          Album activo: {album.name}. Busqueda para {user.city || "ciudad no configurada"}.
        </p>
      </div>
      <SwapMatchesPanel />
    </section>
  );
}
