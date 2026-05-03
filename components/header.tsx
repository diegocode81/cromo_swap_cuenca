"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const userLinks = [
  ["Inicio", "/dashboard"],
  ["Album", "/album"],
  ["Matches", "/matches"],
  ["Chat", "/chat"],
  ["Perfil", "/profile"]
];

export function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session);
  const displayName = session?.user?.name || session?.user?.email || "Usuario";
  const displayMeta = session?.user?.city || session?.user?.email || "Usuario";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-lg font-black text-field">
            CromoSwap Cuenca
          </Link>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {isAuthenticated ? (
              <>
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-2 shadow-sm sm:max-w-[280px]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">Hola, {displayName}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{displayMeta}</p>
                  </div>
                </div>
                {session.user.role === "ADMIN" ? (
                  <Link className="btn-secondary py-2 shadow-sm" href="/admin">
                    Admin
                  </Link>
                ) : null}
                <button className="btn-secondary py-2 shadow-sm" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
                  Salir
                </button>
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
        {isAuthenticated ? (
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
