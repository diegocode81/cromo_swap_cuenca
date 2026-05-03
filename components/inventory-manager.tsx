"use client";

import { useMemo, useState } from "react";

type Sticker = { id: string; number: number; code: string; name: string; section: string };
type Entry = { id: string; status: "HAVE" | "REPEATED" | "MISSING"; quantity: number; sticker: Sticker };
type Filter = "ALL" | "MISSING" | "REPEATED";
type ReportType = "REPEATED" | "MISSING";

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

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <path d="m14.5 14.5 2.5 2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="8.8" cy="8.8" r="5.6" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M6 7V3.8h8V7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 14.2H4.5A1.5 1.5 0 0 1 3 12.7V8.5A1.5 1.5 0 0 1 4.5 7h11A1.5 1.5 0 0 1 17 8.5v4.2a1.5 1.5 0 0 1-1.5 1.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6.5 11.5h7v4.7h-7v-4.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function InventoryManager({
  userName,
  stickers,
  initialEntries,
  defaultStatus
}: {
  userName: string;
  stickers: Sticker[];
  initialEntries: Entry[];
  defaultStatus?: "HAVE" | "REPEATED" | "MISSING";
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [query, setQuery] = useState("");
  const initialFilter: Filter = defaultStatus === "REPEATED" || defaultStatus === "MISSING" ? defaultStatus : "ALL";
  const [filter, setFilter] = useState<Filter>(initialFilter);

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
      const entry = entryBySticker.get(sticker.id);
      if (filter === "ALL") return true;
      if (filter === "MISSING") return entry?.status !== "HAVE" && entry?.status !== "REPEATED";
      return entry?.status === "REPEATED";
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
      if (current?.status === "REPEATED") await mark(stickerId, "HAVE");
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
  const repeatedEntries = entries
    .filter((entry) => entry.status === "REPEATED" && entry.quantity > 0)
    .sort((a, b) => a.sticker.code.localeCompare(b.sticker.code) || a.sticker.number - b.sticker.number);
  const missingStickers = stickers.filter((sticker) => {
    const entry = entryBySticker.get(sticker.id);
    return entry?.status !== "HAVE" && entry?.status !== "REPEATED";
  });

  function printSummary(type: ReportType) {
    const printedAt = new Intl.DateTimeFormat("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
    const isRepeated = type === "REPEATED";
    const title = isRepeated ? "Resumen de cromos repetidos" : "Resumen de cromos faltantes";
    const rows: string[] = isRepeated
      ? repeatedEntries.map(
          (entry, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(`${entry.sticker.code} ${entry.sticker.number}`)}</td>
              <td>${escapeHtml(entry.sticker.section)}</td>
              <td>${entry.quantity}</td>
            </tr>`
        )
      : missingStickers.map(
          (sticker, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(`${sticker.code} ${sticker.number}`)}</td>
              <td>${escapeHtml(sticker.section)}</td>
            </tr>`
        );
    const emptyMessage = isRepeated ? "No tienes cromos repetidos registrados." : "No tienes cromos faltantes registrados.";
    const tableHeaders = isRepeated ? "<th>#</th><th>Codigo</th><th>Pais / seccion</th><th>Rep.</th>" : "<th>#</th><th>Codigo</th><th>Pais / seccion</th>";
    const pages = Array.from({ length: Math.ceil(rows.length / 80) }, (_, index) => rows.slice(index * 80, index * 80 + 80));
    const tables = pages
      .map((pageRows) => {
        const leftRows = pageRows.slice(0, 40);
        const rightRows = pageRows.slice(40, 80);
        return `
          <div class="print-page">
            <div class="print-columns">
              <table class="print-table"><thead><tr>${tableHeaders}</tr></thead><tbody>${leftRows.join("")}</tbody></table>
              ${rightRows.length > 0 ? `<table class="print-table"><thead><tr>${tableHeaders}</tr></thead><tbody>${rightRows.join("")}</tbody></table>` : "<div></div>"}
            </div>
          </div>`;
      })
      .join("");
    const reportWindow = window.open("", "_blank", "width=900,height=700");
    if (!reportWindow) return;

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            body { background: #fff; color: #000; font-family: Arial, sans-serif; font-size: 8px; margin: 0; padding: 8mm; }
            .print-report { width: 100%; }
            .print-title { font-size: 14px; font-weight: 700; margin: 0 0 3px 0; }
            .print-subtitle { font-size: 11px; font-weight: 700; margin: 0 0 6px 0; }
            .print-meta { font-size: 8px; line-height: 1.2; margin-bottom: 5px; }
            .print-list-title { font-size: 8px; font-weight: 700; margin: 0 0 4px; }
            .print-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
            .print-page { break-after: page; page-break-after: always; page-break-inside: avoid; }
            .print-page:last-child { break-after: auto; page-break-after: auto; }
            .print-table { border-collapse: collapse; font-size: 7.5px; width: 100%; }
            .print-table th, .print-table td { border: 1px solid #bbb; height: 10px; line-height: 1.05; padding: 1px 3px; text-align: left; }
            .print-table th { background: #f2f2f2; font-weight: 700; }
            .empty { border: 1px solid #bbb; font-size: 8px; padding: 6px; }
            @media screen {
              body { padding: 24px; }
              .print-report { max-width: 760px; }
            }
          </style>
        </head>
        <body>
          <div class="print-report">
            <h1 class="print-title">CromoSwap Cuenca</h1>
            <h2 class="print-subtitle">${escapeHtml(title)}</h2>
            <div class="print-meta">Fecha: ${escapeHtml(printedAt)} | Usuario: ${escapeHtml(userName || "Usuario")}</div>
            <p class="print-list-title">Lista de cromos:</p>
            ${rows.length > 0 ? tables : `<p class="empty">${escapeHtml(emptyMessage)}</p>`}
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr_1fr]">
        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="mb-2 text-sm font-bold text-slate-500">Progreso del album</p>
          <div
            className="grid h-24 w-24 place-items-center rounded-full transition-all duration-700 ease-out"
            style={{
              background: `conic-gradient(#2f855f ${progress * 3.6}deg, #e5e7eb 0deg)`
            }}
          >
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-inner">
              <span className="text-2xl font-black text-field">{progress}%</span>
            </div>
          </div>
          <p className="mt-2 text-xs font-black text-ink">{owned}/{stickers.length} cromos registrados</p>
        </div>

        <div className="flex h-full flex-col justify-center rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <p className="mb-3 text-sm font-bold text-slate-500">Buscar cromos</p>
          <div className="grid gap-2">
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                className="rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm shadow-sm transition hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-blue-100"
                placeholder="Buscar por numero, seccion o nombre"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              className="rounded-xl border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-blue-100"
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
            >
              <option value="ALL">Todos</option>
              <option value="MISSING">Faltantes</option>
              <option value="REPEATED">Repetidos</option>
            </select>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-sm font-bold text-slate-500">Repetidos</p>
            <p className="mt-1 text-3xl font-black text-ink">{repeatedEntries.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">cromos repetidos</p>
          </div>
          <button className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100" onClick={() => printSummary("REPEATED")}>
            <PrintIcon />
            Imprimir resumen
          </button>
        </div>
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-sm font-bold text-slate-500">Faltantes</p>
            <p className="mt-1 text-3xl font-black text-ink">{missingStickers.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">cromos faltantes</p>
          </div>
          <button className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100" onClick={() => printSummary("MISSING")}>
            <PrintIcon />
            Imprimir resumen
          </button>
        </div>
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
