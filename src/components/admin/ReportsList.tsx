"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Flag, Trash2, Undo2 } from "lucide-react";

// A report as the list shows it. The date arrives as text, so server and browser render the same.
export type ShownReport = {
  id: string;
  reason: string;
  details: string;
  open: boolean;
  date: string;
  // The listing's page, or null once the listing has been deleted.
  listing: { href: string | null; title: string; number: number | null };
  seller: { id: string; username: string } | null;
  reporter: { id: string; username: string } | null;
};

const action =
  "flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

const person = (who: ShownReport["seller"]) =>
  who ? (
    <Link href={`/admin/users/${who.id}`} className="font-semibold text-brand-rose hover:underline">
      {who.username}
    </Link>
  ) : (
    <span className="text-brand-ink/50">изтрит профил</span>
  );

// The administrator's list of reports about listings: what is reported, by whom and why. A
// report can be marked as looked at, put back as waiting, or removed.
export default function ReportsList({ reports }: { reports: ShownReport[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const [confirming, setConfirming] = useState<string>();
  const [error, setError] = useState<{ id: string; message: string }>();

  const send = async (id: string, init: RequestInit) => {
    setBusy(id);
    setError(undefined);
    try {
      const response = await fetch(`/api/admin/reports/${id}`, init);
      // 404 means it is gone already, e.g. removed in another tab.
      if (response.ok || response.status === 404) {
        setConfirming(undefined);
        router.refresh();
      } else {
        setError({ id, message: (await response.json().catch(() => ({}))).message ?? "Нещо се обърка. Опитай отново." });
      }
    } catch {
      setError({ id, message: "Провери връзката си и опитай отново." });
    }
    setBusy(undefined);
  };

  const resolve = (id: string, resolved: boolean) =>
    send(id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resolved }) });

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <Flag className="size-7" aria-hidden />
        </span>
        Няма получени сигнали.
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {reports.map(({ id, reason, details, open, date, listing, seller, reporter }) => (
        <li key={id} className={`rounded-2xl border p-4 ${open ? "border-brand-rose/30 bg-brand-rose/5" : "border-black/5 bg-zinc-50"}`}>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-brand-ink">
                {reason}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    open ? "bg-brand-rose text-white" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {open ? "Чака преглед" : "Разгледан"}
                </span>
              </p>
              <p className="mt-1 text-sm text-brand-ink/80">
                Обява:{" "}
                {listing.href ? (
                  <Link href={listing.href} className="font-semibold text-brand-rose hover:underline">
                    {listing.title}
                  </Link>
                ) : (
                  <span className="font-semibold">{listing.title} (изтрита)</span>
                )}
                {listing.number !== null && <span className="text-brand-ink/50"> · ID {listing.number}</span>}
              </p>
              <p className="mt-0.5 text-xs text-brand-ink/60">
                Продавач: {person(seller)} · Докладвал: {person(reporter)} · {date}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {confirming === id ? (
                <>
                  <button
                    type="button"
                    disabled={busy === id}
                    onClick={() => send(id, { method: "DELETE" })}
                    className={`${action} border-red-600 bg-red-600 text-white hover:bg-red-700`}
                  >
                    Да, изтрий
                  </button>
                  <button
                    type="button"
                    disabled={busy === id}
                    onClick={() => setConfirming(undefined)}
                    className={`${action} border-black/10 bg-white text-brand-ink hover:border-brand-rose/50`}
                  >
                    Отказ
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy === id}
                    onClick={() => resolve(id, open)}
                    className={`${action} bg-white ${
                      open ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50" : "border-black/10 text-brand-ink hover:border-brand-rose/50"
                    }`}
                  >
                    {open ? <Check className="size-4" aria-hidden /> : <Undo2 className="size-4" aria-hidden />}
                    {open ? "Разгледан" : "Върни като чакащ"}
                  </button>
                  <button
                    type="button"
                    aria-label="Изтрий сигнала"
                    title="Изтрий сигнала"
                    disabled={busy === id}
                    onClick={() => setConfirming(id)}
                    className={`${action} border-red-600/40 bg-white px-2.5 text-red-600 hover:bg-red-600/10`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>

          {details && (
            <p className="mt-3 rounded-xl bg-white px-3.5 py-2.5 text-sm leading-6 wrap-anywhere whitespace-pre-line text-brand-ink/80">
              {details}
            </p>
          )}
          {error?.id === id && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {error.message}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
