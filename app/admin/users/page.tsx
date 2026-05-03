import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AdminPasswordForm, ToggleUserButton } from "@/components/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 10;
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } }
        ]
      }
    : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        role: true,
        isActive: true,
        _count: { select: { stickers: true, messages: true, reportsGot: true } }
      }
    }),
    prisma.user.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const querySuffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-black">Usuarios</h1>
        <p className="text-sm text-slate-600">{total} usuarios encontrados · pagina {page} de {totalPages}</p>
      </div>
      <form className="card grid gap-3 sm:grid-cols-[1fr_auto]" action="/admin/users">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, email o ciudad" />
        <button className="btn-primary" type="submit">Buscar</button>
      </form>
      <div className="grid gap-3 lg:grid-cols-2">
        {users.map((user) => (
          <article key={user.id} className="card space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-lg font-black">{user.name}</h2>
                <p className="text-sm text-slate-600">{user.email}</p>
                <p className="text-sm text-slate-600">{user.city} · {user.role}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {user._count.stickers} cromos · {user._count.messages} mensajes · {user._count.reportsGot} reportes
                </p>
              </div>
              <ToggleUserButton userId={user.id} isActive={user.isActive} />
            </div>
            <AdminPasswordForm userId={user.id} />
          </article>
        ))}
        {users.length === 0 ? <div className="card text-slate-600">No hay usuarios con ese filtro.</div> : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        {page > 1 ? (
          <Link className="btn-secondary" href={`/admin/users?page=${page - 1}${querySuffix}`}>
            Anterior
          </Link>
        ) : (
          <span />
        )}
        {page < totalPages ? (
          <Link className="btn-secondary" href={`/admin/users?page=${page + 1}${querySuffix}`}>
            Siguiente
          </Link>
        ) : null}
      </div>
    </section>
  );
}
