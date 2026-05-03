import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <section className="py-8">
      <h1 className="mb-2 text-center text-3xl font-black">Recuperar contrasena</h1>
      <p className="mb-6 text-center text-slate-600">Te enviaremos un enlace temporal si el correo esta registrado.</p>
      <ForgotPasswordForm />
      <p className="mt-5 text-center text-sm">
        Recordaste tu contrasena?{" "}
        <Link href="/login" className="font-semibold text-field">
          Iniciar sesion
        </Link>
      </p>
    </section>
  );
}
