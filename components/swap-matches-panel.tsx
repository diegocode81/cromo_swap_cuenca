"use client";

import { useState } from "react";

type SwapSticker = {
  stickerId: string;
  stickerNumber: number;
  stickerCode: string;
  stickerName: string;
  section: string;
  quantity: number;
  availableQuantity: number;
};

type SwapMatch = {
  userId: string;
  userName: string;
  city: string;
  exchangeQuantity: number;
  youGive: SwapSticker[];
  youReceive: SwapSticker[];
};

function StickerList({ stickers }: { stickers: SwapSticker[] }) {
  return (
    <ul className="mt-2 grid gap-2">
      {stickers.map((sticker) => (
        <li key={sticker.stickerId} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="font-black">
            {sticker.stickerCode} {sticker.stickerNumber}
          </span>
          <span className="text-slate-600"> · {sticker.section}</span>
          <span className="block text-xs font-semibold text-slate-500">
            Cantidad: {sticker.quantity} · Disponible: {sticker.availableQuantity}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SwapMatchesPanel() {
  const [matches, setMatches] = useState<SwapMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchMatches() {
    setIsLoading(true);
    setError("");
    setHasSearched(true);

    const response = await fetch("/api/swaps/matches", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { matches?: SwapMatch[]; error?: string };

    setIsLoading(false);
    if (!response.ok) {
      setMatches([]);
      setError(data.error ?? "No se pudo buscar intercambios en este momento.");
      return;
    }

    setMatches(data.matches ?? []);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-lg border border-emerald-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black">Buscar posibles intercambios</h2>
          <p className="text-sm text-slate-600">Se comparan tus repetidos y faltantes con usuarios de tu misma ciudad.</p>
        </div>
        <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={searchMatches} disabled={isLoading}>
          {isLoading ? "Buscando..." : "Buscar intercambios"}
        </button>
      </div>

      {error ? <div className="card text-red-600">{error}</div> : null}

      {hasSearched && !isLoading && !error && matches.length === 0 ? (
        <div className="card text-slate-600">No encontramos intercambios disponibles en tu ciudad por ahora.</div>
      ) : null}

      {matches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => (
            <article key={match.userId} className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{match.userName}</h2>
                  <p className="text-sm text-slate-600">{match.city}</p>
                </div>
                <span className="rounded-full bg-field px-3 py-1 text-sm font-black text-white">
                  {match.exchangeQuantity} cromos
                </span>
              </div>
              <div>
                <p className="label">Entregas</p>
                <StickerList stickers={match.youGive} />
              </div>
              <div>
                <p className="label">Recibes</p>
                <StickerList stickers={match.youReceive} />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
