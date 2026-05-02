"use client";

import { useRouter } from "next/navigation";

type StickerInfo = { id: string; number: number; code: string; name: string; section: string };
type Match = {
  id: string;
  score: number;
  userAId: string;
  userBId: string;
  stickersFromAToB: StickerInfo[];
  stickersFromBToA: StickerInfo[];
  userA: { id: string; name: string; zone: string };
  userB: { id: string; name: string; zone: string };
  album: { name: string };
};

export function MatchesList({ matches, currentUserId }: { matches: Match[]; currentUserId: string }) {
  const router = useRouter();

  async function startChat(matchId: string) {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exchangeMatchId: matchId })
    });
    if (!response.ok) return;
    const data = await response.json();
    router.push(`/chat/${data.conversation.id}`);
  }

  if (matches.length === 0) {
    return <div className="card text-slate-600">Aun no hay intercambios sugeridos. Registra repetidos y faltantes.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {matches.map((match) => {
        const other = match.userAId === currentUserId ? match.userB : match.userA;
        const givesMe = match.userAId === currentUserId ? match.stickersFromBToA : match.stickersFromAToB;
        const iGive = match.userAId === currentUserId ? match.stickersFromAToB : match.stickersFromBToA;
        return (
          <article key={match.id} className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{other.name}</h2>
                <p className="text-sm text-slate-600">{other.zone} · {match.album.name}</p>
              </div>
              <span className="rounded-full bg-field px-3 py-1 text-sm font-black text-white">{match.score}%</span>
            </div>
            <div>
              <p className="label">Te puede dar</p>
              <p className="text-sm">{givesMe.length ? givesMe.map((s) => `${s.code} ${s.number}`).join(", ") : "Sin cromos en esta direccion"}</p>
            </div>
            <div>
              <p className="label">Tu puedes dar</p>
              <p className="text-sm">{iGive.length ? iGive.map((s) => `${s.code} ${s.number}`).join(", ") : "Sin cromos en esta direccion"}</p>
            </div>
            <button className="btn-primary w-full" onClick={() => startChat(match.id)}>
              Enviar mensaje
            </button>
          </article>
        );
      })}
    </div>
  );
}
