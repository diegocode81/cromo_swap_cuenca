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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const confirmed = window.confirm(
      "Esto no eliminara usuarios ni historial, pero iniciara el intercambio desde cero para el nuevo album."
    );
    if (!confirmed) return;
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/albums/restart-season", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        totalStickers: form.get("totalStickers")
      })
    });
    setMessage(response.ok ? "Nuevo album activo creado." : "No se pudo crear el album.");
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <h2 className="text-xl font-black">Crear nuevo album / Reiniciar temporada</h2>
      <input name="name" placeholder="Nombre del album" required />
      <textarea name="description" placeholder="Descripcion" required />
      <input name="totalStickers" type="number" min={1} placeholder="Cantidad total de cromos" required />
      <p className="text-sm text-slate-600">
        Esto no eliminara usuarios ni historial, pero iniciara el intercambio desde cero para el nuevo album.
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
    const response = await fetch(`/api/admin/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !active })
    });
    if (response.ok) setActive(!active);
  }
  return <button className="btn-secondary py-2" onClick={toggle}>{active ? "Desactivar" : "Activar"}</button>;
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
