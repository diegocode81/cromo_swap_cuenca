"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminCity = {
  id: string;
  name: string;
  province: string;
  slug: string;
  isActive: boolean;
};

export function AdminCityManager({ cities, initialError = "" }: { cities: AdminCity[]; initialError?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState(initialError);

  const visibleCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;

    return cities.filter((city) =>
      [city.name, city.province, city.slug].some((value) => value.toLowerCase().includes(q))
    );
  }, [cities, query]);

  async function createCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        province: form.get("province"),
        isActive: form.get("isActive") === "on"
      })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo crear la ciudad.");
      return;
    }

    formElement.reset();
    setMessage("Ciudad creada.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={createCity} className="card grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div>
          <label className="label">Ciudad</label>
          <input name="name" required placeholder="Cuenca" />
        </div>
        <div>
          <label className="label">Provincia</label>
          <input name="province" required placeholder="Azuay" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 md:pb-3">
          <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
          Activa
        </label>
        <button className="btn-primary" type="submit">Crear ciudad</button>
        {message ? (
          <p className={`text-sm font-semibold md:col-span-4 ${initialError ? "text-red-600" : "text-field"}`}>
            {message}
          </p>
        ) : null}
      </form>

      <div className="card">
        <label className="label">Buscar ciudad</label>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, provincia o slug" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {visibleCities.map((city) => (
          <AdminCityCard key={city.id} city={city} />
        ))}
        {visibleCities.length === 0 ? (
          <div className="card text-sm font-semibold text-slate-600">
            {query.trim() ? "No hay ciudades con ese filtro." : "No hay ciudades registradas todavia."}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AdminCityCard({ city }: { city: AdminCity }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function updateCity(payload: Partial<Pick<AdminCity, "name" | "province" | "isActive">>) {
    setIsSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/cities/${city.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo actualizar la ciudad.");
      return;
    }

    setMessage("Ciudad actualizada.");
    router.refresh();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await updateCity({
      name: String(form.get("name") ?? ""),
      province: String(form.get("province") ?? "")
    });
  }

  async function remove() {
    const confirmed = window.confirm(`Eliminar ${city.name}? Solo se puede eliminar si no tiene usuarios asociados.`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    const response = await fetch(`/api/admin/cities/${city.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo eliminar la ciudad.");
      return;
    }

    router.refresh();
  }

  return (
    <article className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{city.name}</h2>
          <p className="text-sm text-slate-600">{city.province} · {city.slug}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${city.isActive ? "bg-field text-white" : "bg-slate-100 text-slate-600"}`}>
          {city.isActive ? "Activa" : "Inactiva"}
        </span>
      </div>

      <form onSubmit={save} className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label">Ciudad</label>
          <input name="name" defaultValue={city.name} required />
        </div>
        <div>
          <label className="label">Provincia</label>
          <input name="province" defaultValue={city.province} required />
        </div>
        <button className="btn-secondary py-2 sm:col-span-2" type="submit" disabled={isSaving}>
          {isSaving ? "Guardando" : "Guardar cambios"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary py-2" type="button" onClick={() => updateCity({ isActive: !city.isActive })} disabled={isSaving}>
          {city.isActive ? "Desactivar" : "Activar"}
        </button>
        <button className="btn-secondary py-2 text-red-700" type="button" onClick={remove} disabled={isSaving}>
          Eliminar
        </button>
      </div>

      {message ? <p className="text-sm font-semibold text-slate-600">{message}</p> : null}
    </article>
  );
}
