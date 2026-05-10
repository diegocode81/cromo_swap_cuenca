import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { PwaInstallButton } from "@/components/pwa-install-button";

export default function LoginPage({ searchParams }: { searchParams: { reset?: string } }) {
  return (
    <section className="py-8">
      <h1 className="mb-2 text-center text-3xl font-black">Iniciar sesion</h1>
      <p className="mb-6 text-center text-slate-600">Entra para gestionar tus cromos y matches.</p>
      {searchParams.reset === "success" ? (
        <p className="mx-auto mb-4 max-w-md rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-field">
          Contrasena actualizada correctamente.
        </p>
      ) : null}
      <LoginForm />
      <PwaInstallButton />
      <p className="mt-5 text-center text-sm">
        No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-field">
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
