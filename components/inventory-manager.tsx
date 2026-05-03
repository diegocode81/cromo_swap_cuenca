"use client";

import { useMemo, useState } from "react";

type Sticker = { id: string; number: number; code: string; name: string; section: string };
type Entry = { id: string; status: "HAVE" | "REPEATED" | "MISSING"; quantity: number; sticker: Sticker };

const labels = { HAVE: "Tengo", REPEATED: "Repetido", MISSING: "Sin registrar" };

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M16 5.5 7.75 13.75 4 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="m12 4 8 4.5-8 4.5-8-4.5L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m4 13 8 4.5L20 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 17 8 4.5L20 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 5.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 3.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m5.5 5.5.7 10.2A1.8 1.8 0 0 0 8 17.4h4a1.8 1.8 0 0 0 1.8-1.7l.7-10.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 8.5v5.5M11.5 8.5v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  const [filter, setFilter] = useState<"ALL" | "HAVE" | "REPEATED">(defaultStatus === "MISSING" ? "ALL" : defaultStatus ?? "ALL");

  const entryBySticker = useMemo(() => new Map(entries.map((entry) => [entry.sticker.id, entry])), [entries]);
  const visibleStickers = stickers
    .filter((sticker) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        String(sticker.number).includes(q) ||
        sticker.code.toLowerCase().includes(q) ||
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

  async function adjustRepeated(stickerId: string, delta: number) {
    const current = entryBySticker.get(stickerId);
    const currentQuantity = current?.status === "REPEATED" ? current.quantity : 0;
    const nextQuantity = Math.max(0, currentQuantity + delta);

    if (nextQuantity === 0) {
      if (current?.status === "REPEATED") await remove(current.id);
      return;
    }

    const response = await fetch("/api/user-stickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stickerId,
        status: "REPEATED",
        quantity: nextQuantity
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
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleStickers.map((sticker) => {
          const entry = entryBySticker.get(sticker.id);
          const hasSticker = entry?.status === "HAVE" || entry?.status === "REPEATED";
          const repeatedQuantity = entry?.status === "REPEATED" ? entry.quantity : 0;
          return (
            <article key={sticker.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">{sticker.section}</p>
                  <h2 className="mt-1 text-3xl font-black leading-none text-slate-950">{sticker.code} {sticker.number}</h2>
                  {sticker.name !== sticker.section ? <p className="text-sm text-slate-600">{sticker.name}</p> : null}
                </div>
                <button
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition sm:px-4 ${
                    hasSticker
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  onClick={() => mark(sticker.id, "HAVE")}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full border ${hasSticker ? "border-blue-500" : "border-slate-300"}`}>
                    <CheckIcon />
                  </span>
                  Tengo
                </button>
              </div>

              <div className="my-5 h-px bg-slate-200" />

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <StackIcon />
                  </span>
                  <span className="truncate text-sm font-bold text-slate-700 sm:text-base">{labels.REPEATED}</span>
                </div>
                <div className="grid grid-cols-[38px_48px_38px] items-center gap-2 sm:grid-cols-[42px_54px_42px]">
                  <button
                    className="grid h-10 w-10 place-items-center rounded-lg border border-blue-200 bg-white text-xl font-black leading-none text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
                    disabled={entry?.status !== "REPEATED"}
                    onClick={() => adjustRepeated(sticker.id, -1)}
                    aria-label={`Restar repetido de ${sticker.code} ${sticker.number}`}
                  >
                    -
                  </button>
                  <span className="grid h-10 place-items-center rounded-lg border border-slate-200 bg-white px-2 text-center text-lg font-black text-slate-950 shadow-sm">
                    {repeatedQuantity}
                  </span>
                  <button
                    className="grid h-10 w-10 place-items-center rounded-lg border border-blue-200 bg-white text-2xl font-semibold leading-none text-blue-600 shadow-sm transition hover:bg-blue-50"
                    onClick={() => adjustRepeated(sticker.id, 1)}
                    aria-label={`Sumar repetido de ${sticker.code} ${sticker.number}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {entry ? (
                <>
                  <div className="my-4 h-px bg-slate-200" />
                  <button className="inline-flex items-center gap-2 text-sm font-bold text-red-600 transition hover:text-red-700" onClick={() => remove(entry.id)}>
                    <TrashIcon />
                  Quitar registro
                  </button>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
