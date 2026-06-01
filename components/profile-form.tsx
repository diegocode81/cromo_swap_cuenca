"use client";

import { FormEvent, useState } from "react";
import { CITIES } from "@/lib/cities";

export function ProfileForm({ user }: { user: { name: string; email: string; city: string; phone: string | null } }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), city: form.get("city"), phone: form.get("phone") })
    });
    if (!response.ok) {
      setError("No se pudo actualizar el perfil. Revisa la ciudad y el celular.");
      return;
    }
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
      <div>
        <label className="label">Celular</label>
        <input name="phone" type="tel" defaultValue={user.phone ?? ""} required minLength={9} maxLength={20} placeholder="0987654321" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm font-semibold text-field">Perfil actualizado.</p> : null}
      <button className="btn-primary" type="submit">Guardar cambios</button>
    </form>
  );
}
