"use client";

import { FormEvent, useState } from "react";

export function RunAgentButton() {
  const [message, setMessage] = useState("");
  async function run() {
    setMessage("Ejecutando...");
    const response = await fetch("/api/admin/run-agent", { method: "POST" });
    const data = await response.json();
    setMessage(response.ok ? `Matches revisados: ${data.generatedMatches}` : "No se pudo ejecutar");
  }
  return (
    <div>
      <button className="btn-primary" onClick={run}>Ejecutar agente</button>
      {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

export function RestartSeasonForm() {
  const [message, setMessage] = useState("");

  function parseSections(raw: FormDataEntryValue | null) {
    return String(raw ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [code, name, count] = line.split(",").map((part) => part.trim());
        return { code, name, count: Number(count) };
      })
      .filter((section) => section.code && section.name && Number.isFinite(section.count) && section.count > 0);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sections = parseSections(form.get("sections"));
    const status = String(form.get("status"));
    const response = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        totalStickers: form.get("totalStickers") || undefined,
        sections: sections.length > 0 ? sections : undefined
      })
    });

    if (!response.ok) {
      setMessage("No se pudo crear el album. Revisa las secciones.");
      return;
    }

    const data = await response.json();
    if (status === "ACTIVE") {
      const confirmed = window.confirm("Al activar este album, los usuarios podran registrar cromos y generar matches.");
      if (confirmed) {
        await fetch(`/api/admin/albums/${data.album.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" })
        });
      }
    }

    setMessage(status === "ACTIVE" ? "Album creado y activado." : "Album creado como borrador.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="text-xl font-black">Crear album</h2>
      <input name="name" placeholder="Nombre del album" required />
      <textarea name="description" placeholder="Descripcion" required />
      <textarea
        name="sections"
        rows={7}
        placeholder={"Secciones: CODIGO,Nombre,cantidad\nHAI,Haiti,20\nECU,Ecuador,20\nGEN,General,40"}
      />
      <input name="totalStickers" type="number" min={1} placeholder="Cantidad total si no usas secciones" />
      <select name="status" defaultValue="DRAFT">
        <option value="DRAFT">Borrador</option>
        <option value="ACTIVE">Activo para usuarios</option>
      </select>
      <p className="text-sm text-slate-600">
        Usa una linea por seccion. El numero de cromo reinicia en cada codigo, por ejemplo HAI 1, HAI 2.
      </p>
      <button className="btn-primary" type="submit">Crear nuevo album</button>
      {message ? <p className="text-sm font-semibold text-field">{message}</p> : null}
    </form>
  );
}

export function ToggleUserButton({ userId, isActive }: { userId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  async function toggle() {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !active })
    });
    if (response.ok) setActive(!active);
  }
  return <button className="btn-secondary py-2" onClick={toggle}>{active ? "Desactivar" : "Activar"}</button>;
}

export function ToggleAlbumButton({ albumId, isActive }: { albumId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  async function toggle() {
    if (!active) {
      const confirmed = window.confirm("Al activar este album, se desactivara el album activo actual.");
      if (!confirmed) return;
    }
    const response = await fetch(`/api/admin/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: active ? "ARCHIVED" : "ACTIVE" })
    });
    if (response.ok) setActive(!active);
  }
  return <button className="btn-secondary py-2" onClick={toggle}>{active ? "Desactivar" : "Activar"}</button>;
}

export function DeleteAlbumButton({ albumId, albumName }: { albumId: string; albumName: string }) {
  const [deleted, setDeleted] = useState(false);

  async function remove() {
    const confirmed = window.confirm(
      `Eliminar ${albumName}? Se borraran cromos, inventarios, matches, chats y reportes relacionados con este album.`
    );
    if (!confirmed) return;
    const response = await fetch(`/api/admin/albums/${albumId}`, { method: "DELETE" });
    if (response.ok) setDeleted(true);
  }

  if (deleted) return <p className="text-sm font-semibold text-red-600">Album eliminado.</p>;
  return <button className="btn-secondary py-2 text-red-700" onClick={remove}>Eliminar album</button>;
}

export function ReportStatusSelect({ reportId, status }: { reportId: string; status: string }) {
  const [value, setValue] = useState(status);
  async function change(next: string) {
    setValue(next);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
  }
  return (
    <select value={value} onChange={(event) => change(event.target.value)}>
      <option value="OPEN">OPEN</option>
      <option value="REVIEWING">REVIEWING</option>
      <option value="RESOLVED">RESOLVED</option>
      <option value="DISMISSED">DISMISSED</option>
    </select>
  );
}
