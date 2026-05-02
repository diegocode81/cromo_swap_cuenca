"use client";

import { FormEvent, useState } from "react";
import { CUENCA_ZONES } from "@/lib/zones";

export function ProfileForm({ user }: { user: { name: string; email: string; city: string; zone: string } }) {
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), zone: form.get("zone") })
    });
    setSaved(response.ok);
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input name="name" defaultValue={user.name} required />
      </div>
      <div>
        <label className="label">Email</label>
        <input value={user.email} readOnly />
      </div>
      <div>
        <label className="label">Ciudad</label>
        <input value={user.city} readOnly />
      </div>
      <div>
        <label className="label">Zona</label>
        <select name="zone" defaultValue={user.zone}>
          {CUENCA_ZONES.map((zone) => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>
      </div>
      {saved ? <p className="text-sm font-semibold text-field">Perfil actualizado.</p> : null}
      <button className="btn-primary" type="submit">Guardar cambios</button>
    </form>
  );
}
