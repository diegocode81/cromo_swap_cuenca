import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid min-h-[70vh] items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-3 font-semibold text-field">Comunidad de coleccionistas en Cuenca</p>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">CromoSwap Cuenca</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-700">
          Intercambia cromos con personas de Cuenca de forma organizada y segura.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary">
            Crear cuenta
          </Link>
          <Link href="/login" className="btn-secondary">
            Iniciar sesion
          </Link>
        </div>
      </div>
      <div className="rounded-lg bg-[linear-gradient(135deg,#2e7d5b,#f4b63f)] p-1 shadow-soft">
        <div className="rounded-lg bg-white p-6">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="aspect-[3/4] rounded-md border border-emerald-100 bg-sky p-2">
                <div className="h-4 w-10 rounded bg-field/80" />
                <div className="mt-8 h-8 rounded bg-white/80" />
                <p className="mt-6 text-center text-xs font-bold text-field">#{index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
