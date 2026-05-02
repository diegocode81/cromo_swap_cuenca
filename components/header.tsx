import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const userLinks = [
  ["Inicio", "/dashboard"],
  ["Album", "/album"],
  ["Repetidos", "/repeated"],
  ["Faltantes", "/missing"],
  ["Matches", "/matches"],
  ["Chat", "/chat"],
  ["Perfil", "/profile"]
];

export async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={session ? "/dashboard" : "/"} className="text-lg font-black text-field">
            CromoSwap Cuenca
          </Link>
          <div className="flex gap-2">
            {session ? (
              <>
                {session.user.role === "ADMIN" ? (
                  <Link className="btn-secondary py-2" href="/admin">
                    Admin
                  </Link>
                ) : null}
                <Link className="btn-secondary py-2" href="/api/auth/signout">
                  Salir
                </Link>
              </>
            ) : (
              <>
                <Link className="btn-secondary py-2" href="/login">
                  Iniciar
                </Link>
                <Link className="btn-primary py-2" href="/register">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
        {session ? (
          <nav className="flex gap-2 overflow-x-auto pb-1 text-sm">
            {userLinks.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-full bg-sky px-3 py-2 font-medium">
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
