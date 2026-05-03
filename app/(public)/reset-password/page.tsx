import { ResetPasswordForm } from "@/components/auth-forms";

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <section className="py-8">
      <h1 className="mb-2 text-center text-3xl font-black">Cambiar contrasena</h1>
      <p className="mb-6 text-center text-slate-600">Ingresa una nueva contrasena para tu cuenta.</p>
      <ResetPasswordForm token={searchParams.token} />
    </section>
  );
}
