import { ToggleUserButton } from "@/components/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, city: true, zone: true, role: true, isActive: true }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Usuarios</h1>
      <div className="grid gap-3">
        {users.map((user) => (
          <article key={user.id} className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-black">{user.name}</h2>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="text-sm text-slate-600">{user.city} · {user.zone} · {user.role}</p>
            </div>
            <ToggleUserButton userId={user.id} isActive={user.isActive} />
          </article>
        ))}
      </div>
    </section>
  );
}
