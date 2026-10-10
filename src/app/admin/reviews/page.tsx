import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReportsList from "@/components/admin/ReportsList";
import { getAdmin } from "@/lib/admin";
import { listReports } from "@/lib/reports";

export const metadata: Metadata = {
  title: "Ревюта и сигнали",
};

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// The reports sent with the "Докладвай" button on a listing's page, the ones still waiting first.
export default async function AdminReports() {
  if (!(await getAdmin())) notFound();
  const reports = await listReports();
  const waiting = reports.filter(({ status }) => status === "open").length;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Ревюта и сигнали</h1>
      <p className="mt-1 text-sm text-brand-ink/60">
        Сигналите, изпратени с бутона „Докладвай“ в страницата на обява. Чакащи преглед: {waiting} от {reports.length}.
      </p>

      <ReportsList
        reports={reports.map((report) => ({
          id: report.id,
          reason: report.reason,
          details: report.details,
          open: report.status === "open",
          date: dateFormat.format(report.createdAt),
          listing: {
            href: report.listing.id ? `/product/${report.listing.id}` : null,
            title: report.listing.title,
            number: report.listing.number,
          },
          seller: report.seller,
          reporter: report.reporter,
        }))}
      />
    </div>
  );
}
