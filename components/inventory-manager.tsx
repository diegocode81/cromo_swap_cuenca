"use client";

import { useMemo, useState } from "react";

type Sticker = { id: string; number: number; name: string; section: string };
type Entry = { id: string; status: "HAVE" | "REPEATED" | "MISSING"; quantity: number; sticker: Sticker };

const labels = { HAVE: "Tengo", REPEATED: "Repetido", MISSING: "Me falta" };

export function InventoryManager({
  stickers,
  initialEntries,
  defaultStatus
}: {
  stickers: Sticker[];
  initialEntries: Entry[];
  defaultStatus?: "HAVE" | "REPEATED" | "MISSING";
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "HAVE" | "REPEATED" | "MISSING">(defaultStatus ?? "ALL");

  const entryBySticker = useMemo(() => new Map(entries.map((entry) => [entry.sticker.id, entry])), [entries]);
  const visibleStickers = stickers
    .filter((sticker) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        String(sticker.number).includes(q) ||
        sticker.name.toLowerCase().includes(q) ||
        sticker.section.toLowerCase().includes(q)
      );
    })
    .filter((sticker) => {
      if (filter === "ALL") return true;
      return entryBySticker.get(sticker.id)?.status === filter;
    })
    .slice(0, 120);

  async function mark(stickerId: string, status: "HAVE" | "REPEATED" | "MISSING") {
    const current = entryBySticker.get(stickerId);
    const response = await fetch("/api/user-stickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stickerId,
        status,
        quantity: status === "REPEATED" ? Math.max(2, current?.quantity ?? 2) : 1
      })
    });
    if (!response.ok) return;
    const data = (await response.json()) as { entry: Entry };
    setEntries((prev) => [data.entry, ...prev.filter((entry) => entry.id !== data.entry.id)]);
  }

  async function remove(entryId: string) {
    const response = await fetch(`/api/user-stickers/${entryId}`, { method: "DELETE" });
    if (response.ok) setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  }

  const owned = entries.filter((entry) => entry.status === "HAVE" || entry.status === "REPEATED").length;
  const progress = stickers.length ? Math.round((owned / stickers.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Progreso del album activo</p>
            <p className="text-2xl font-black text-field">{progress}%</p>
          </div>
          <p className="text-sm font-semibold">{owned}/{stickers.length}</p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-field" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card grid gap-3 md:grid-cols-[1fr_auto]">
        <input placeholder="Buscar por numero, seccion o nombre" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
          <option value="ALL">Todos</option>
          <option value="HAVE">Tengo</option>
          <option value="REPEATED">Repetidos</option>
          <option value="MISSING">Faltantes</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStickers.map((sticker) => {
          const entry = entryBySticker.get(sticker.id);
          return (
            <article key={sticker.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{sticker.section}</p>
                  <h2 className="text-lg font-black">#{sticker.number} {sticker.name}</h2>
                </div>
                {entry ? <span className="rounded-full bg-sky px-3 py-1 text-xs font-bold">{labels[entry.status]}</span> : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="btn-secondary px-2 py-2" onClick={() => mark(sticker.id, "HAVE")}>Tengo</button>
                <button className="btn-secondary px-2 py-2" onClick={() => mark(sticker.id, "REPEATED")}>Repetido</button>
                <button className="btn-secondary px-2 py-2" onClick={() => mark(sticker.id, "MISSING")}>Me falta</button>
              </div>
              {entry ? (
                <button className="mt-3 text-sm font-semibold text-red-600" onClick={() => remove(entry.id)}>
                  Quitar registro
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
