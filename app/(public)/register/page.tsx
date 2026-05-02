import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <section className="py-8">
      <h1 className="mb-2 text-center text-3xl font-black">Crear cuenta</h1>
      <p className="mb-6 text-center text-slate-600">Solo para intercambios comunitarios en Cuenca.</p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm">
        Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-field">
          Iniciar sesion
        </Link>
      </p>
    </section>
  );
}
