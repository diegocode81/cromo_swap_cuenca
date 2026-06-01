"use client";

import { FormEvent, useState } from "react";
import { CITIES } from "@/lib/cities";

export function ProfileForm({ user }: { user: { name: string; email: string; city: string } }) {
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), city: form.get("city") })
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
        <select name="city" defaultValue={user.city} required>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
      {saved ? <p className="text-sm font-semibold text-field">Perfil actualizado.</p> : null}
      <button className="btn-primary" type="submit">Guardar cambios</button>
    </form>
  );
}
