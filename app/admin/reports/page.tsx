import { ReportStatusSelect } from "@/components/admin-actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await prisma.report.findMany({
    include: {
      reporter: { select: { name: true, email: true } },
      reportedUser: { select: { name: true, email: true, isActive: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Reportes</h1>
      <div className="grid gap-3">
        {reports.map((report) => (
          <article key={report.id} className="card space-y-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <h2 className="font-black">Reportado: {report.reportedUser.name}</h2>
                <p className="text-sm text-slate-600">Por: {report.reporter.name}</p>
              </div>
              <ReportStatusSelect reportId={report.id} status={report.status} />
            </div>
            <p className="text-sm">{report.reason}</p>
          </article>
        ))}
        {reports.length === 0 ? <div className="card text-slate-600">No hay reportes.</div> : null}
      </div>
    </section>
  );
}
