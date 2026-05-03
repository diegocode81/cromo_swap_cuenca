"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/password-input";

type AlbumStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

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

function hasRepeatedSectionCodes(sections: { code: string; name: string; count: number }[]) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  sections.forEach((section) => {
    const code = section.code.toUpperCase();
    if (seen.has(code)) repeated.add(code);
    seen.add(code);
  });
  return Array.from(repeated);
}

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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const sections = parseSections(form.get("sections"));
    const repeatedCodes = hasRepeatedSectionCodes(sections);
    if (repeatedCodes.length > 0) {
      setMessage(`Cada seccion debe tener un codigo unico. Repetidos: ${repeatedCodes.join(", ")}.`);
      return;
    }
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
    formElement.reset();
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

export function EditAlbumForm({
  album
}: {
  album: {
    id: string;
    name: string;
    description: string;
    status: AlbumStatus;
    totalStickers: number;
    sectionsText: string;
    hasCommunityData: boolean;
    canRegenerateCatalog: boolean;
  };
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<AlbumStatus>(album.status);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Guardando...");
    const form = new FormData(event.currentTarget);
    const nextStatus = String(form.get("status")) as AlbumStatus;
    const sections = parseSections(form.get("sections"));
    const repeatedCodes = hasRepeatedSectionCodes(sections);
    if (sections.length > 0 && repeatedCodes.length > 0) {
      setMessage(`Cada seccion debe tener un codigo unico. Repetidos: ${repeatedCodes.join(", ")}.`);
      return;
    }

    if (nextStatus === "ACTIVE" && status !== "ACTIVE") {
      const confirmed = window.confirm("Al activar este album, se desactivara el album activo actual.");
      if (!confirmed) {
        setMessage("");
        return;
      }
    }

    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      status: nextStatus,
      ...(album.hasCommunityData
        ? album.canRegenerateCatalog
          ? {
              totalStickers: form.get("totalStickers") || undefined,
              sections: sections.length > 0 ? sections : undefined
            }
          : {}
        : {
            totalStickers: form.get("totalStickers") || undefined,
            sections: sections.length > 0 ? sections : undefined
          })
    };

    const response = await fetch(`/api/admin/albums/${album.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "No se pudo actualizar el album.");
      return;
    }

    setStatus(nextStatus);
    setMessage("Album actualizado.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input name="name" defaultValue={album.name} required />
        </div>
        <div>
          <label className="label">Estado</label>
          <select name="status" defaultValue={status}>
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo para usuarios</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Descripcion</label>
        <textarea name="description" defaultValue={album.description} required />
      </div>
      <div>
        <label className="label">Secciones</label>
        <textarea
          name="sections"
          rows={5}
          defaultValue={album.sectionsText}
          disabled={!album.canRegenerateCatalog}
          placeholder={"HAI,Haiti,20\nECU,Ecuador,20"}
        />
      </div>
      <p className="text-sm text-slate-600">
        Cada linea necesita un codigo unico porque ese codigo reinicia la numeracion. No repitas GEN para varias secciones.
      </p>
      <div>
        <label className="label">Cantidad total si no usas secciones</label>
        <input
          name="totalStickers"
          type="number"
          min={1}
          defaultValue={album.totalStickers}
          disabled={!album.canRegenerateCatalog}
        />
      </div>
      {album.hasCommunityData && album.canRegenerateCatalog ? (
        <p className="text-sm text-slate-600">
          Como el album esta en borrador, al guardar se limpiaran inventarios, matches y chats de este album antes de
          regenerar el catalogo.
        </p>
      ) : null}
      {album.hasCommunityData && !album.canRegenerateCatalog ? (
        <p className="text-sm text-slate-600">
          El catalogo solo se puede regenerar con datos existentes cuando el album esta en borrador.
        </p>
      ) : null}
      <button className="btn-primary" type="submit">Guardar album</button>
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

export function AdminPasswordForm({ userId }: { userId: string }) {
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "").trim();
    if (password.length < 8) {
      setMessage("La contrasena debe tener minimo 8 caracteres.");
      return;
    }

    setIsSaving(true);
    setMessage("Actualizando...");

    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
        credentials: "same-origin"
      });

      if (response.ok) {
        formElement.reset();
        setMessage("Contrasena actualizada correctamente.");
        return;
      }

      const data = await response.json().catch(() => ({}));
      setMessage(data.error ?? "No se pudo actualizar la contrasena.");
    } catch (error) {
      console.error("[AdminPasswordForm] password update failed", error);
      setMessage(
        "No se pudo conectar con el servidor. Revisa tu conexion e intenta nuevamente."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <PasswordInput name="password" minLength={8} maxLength={80} placeholder="Nueva contrasena" required />
      <button className="btn-secondary py-2 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving}>
        {isSaving ? "Guardando" : "Cambiar"}
      </button>
      {message ? (
        <p className={`text-sm sm:col-span-2 ${message.includes("correctamente") ? "text-field" : "text-slate-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
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
  const [message, setMessage] = useState("");

  async function remove() {
    const confirmed = window.confirm(
      `Eliminar ${albumName}? Se borraran cromos, inventarios, matches, chats, mensajes y reportes relacionados con este album. Tambien se eliminaran cuentas USER que solo tengan actividad en este album.`
    );
    if (!confirmed) return;
    const response = await fetch(`/api/admin/albums/${albumId}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setDeleted(true);
      setMessage(`Album eliminado. Usuarios exclusivos eliminados: ${data.deletedUsers ?? 0}.`);
    } else {
      setMessage(data.error ?? "No se pudo eliminar el album.");
    }
  }

  if (deleted) return <p className="text-sm font-semibold text-red-600">{message}</p>;
  return (
    <div>
      <button className="btn-secondary py-2 text-red-700" onClick={remove}>Eliminar album</button>
      {message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null}
    </div>
  );
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
