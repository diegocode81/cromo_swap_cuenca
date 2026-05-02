"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CUENCA_ZONES } from "@/lib/zones";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false
    });
    if (result?.ok) router.push("/dashboard");
    else setError("Email o contrasena incorrectos.");
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required />
      </div>
      <div>
        <label className="label">Contrasena</label>
        <input name="password" type="password" required />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit">
        Iniciar sesion
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        city: "Cuenca",
        zone: form.get("zone")
      })
    });
    if (!response.ok) {
      setError("No se pudo crear la cuenta. Revisa los datos o usa otro email.");
      return;
    }
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false
    });
    router.push("/dashboard");
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input name="name" required minLength={2} />
      </div>
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required />
      </div>
      <div>
        <label className="label">Contrasena</label>
        <input name="password" type="password" required minLength={8} />
      </div>
      <div>
        <label className="label">Ciudad</label>
        <input value="Cuenca" readOnly />
      </div>
      <div>
        <label className="label">Zona de Cuenca</label>
        <select name="zone" required defaultValue="Centro Historico">
          {CUENCA_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit">
        Crear cuenta
      </button>
    </form>
  );
}
