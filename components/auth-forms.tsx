"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CitySelect } from "@/components/city-select";
import { PasswordInput } from "@/components/password-input";

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
    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Email o contrasena incorrectos.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required />
      </div>
      <div>
        <label className="label">Contrasena</label>
        <PasswordInput name="password" required />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit">
        Iniciar sesion
      </button>
      <div className="text-center">
        <Link href="/forgot-password" className="text-sm font-semibold text-field">
          Olvidaste tu contrasena?
        </Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    setIsSending(false);
    if (!response.ok) {
      setError("No se pudo procesar la solicitud. Revisa el correo e intenta nuevamente.");
      return;
    }
    setMessage(data.message ?? "Si el correo esta registrado, enviaremos instrucciones para recuperar tu contrasena.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required />
      </div>
      {message ? <p className="text-sm font-semibold text-field">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSending}>
        {isSending ? "Enviando..." : "Enviar enlace de recuperacion"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [error, setError] = useState(token ? "" : "El enlace no es valido o expiro.");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword })
    });
    setIsSaving(false);
    if (!response.ok) {
      setError("El enlace no es valido o expiro.");
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div>
        <label className="label">Nueva contrasena</label>
        <PasswordInput name="password" required minLength={8} />
      </div>
      <div>
        <label className="label">Confirmar contrasena</label>
        <PasswordInput name="confirmPassword" required minLength={8} />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSaving || !token}>
        {isSaving ? "Cambiando..." : "Cambiar contrasena"}
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
        city: form.get("city"),
        phone: form.get("phone")
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
        <PasswordInput name="password" required minLength={8} />
      </div>
      <div>
        <label className="label">Ciudad *</label>
        <CitySelect />
      </div>
      <div>
        <label className="label">Celular</label>
        <input name="phone" type="tel" required minLength={9} maxLength={20} placeholder="0987654321" />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit">
        Crear cuenta
      </button>
    </form>
  );
}
