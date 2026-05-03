"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const userLinks = [
  ["Inicio", "/dashboard"],
  ["Album", "/album"],
  ["Repetidos", "/repeated"],
  ["Faltantes", "/missing"],
  ["Matches", "/matches"],
  ["Chat", "/chat"],
  ["Perfil", "/profile"]
];

export function Header() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && Boolean(session);

  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="text-lg font-black text-field">
            CromoSwap Cuenca
          </Link>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                {session.user.role === "ADMIN" ? (
                  <Link className="btn-secondary py-2" href="/admin">
                    Admin
                  </Link>
                ) : null}
                <button className="btn-secondary py-2" type="button" onClick={() => signOut({ callbackUrl: "/" })}>
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
