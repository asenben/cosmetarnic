"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { CircleCheck, Flag, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

// Kept in step with reportReasons and REPORT_DETAILS_MAX in src/lib/reports, which the server enforces.
const reasons = [
  { value: "fake", label: "Фалшив или неоригинален продукт" },
  { value: "scam", label: "Измама или подвеждаща обява" },
  { value: "inappropriate", label: "Неподходящо съдържание" },
  { value: "category", label: "Грешна категория" },
  { value: "duplicate", label: "Повторена обява" },
  { value: "other", label: "Друго" },
];
const DETAILS_MAX = 500;

// "Докладвай" on a listing's page: asks what is wrong with the listing and sends it to the
// administrator. Signed-out visitors get the login form instead.
export default function ReportButton({ listingId }: { listingId: string }) {
  const { requireAuth } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const open = () => {
    if (!requireAuth()) return;
    setError(undefined);
    dialogRef.current?.showModal();
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    if (!data.get("reason")) return setError("Избери причина.");

    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: data.get("reason"), details: data.get("details") }),
      });
      if (response.ok) setSent(true);
      else setError((await response.json().catch(() => ({}))).message ?? "Не успяхме да изпратим сигнала. Опитай отново.");
    } catch {
      setError("Провери връзката си и опитай отново.");
    }
    setBusy(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={open}
        className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-brand-rose"
      >
        <Flag className="size-4" aria-hidden />
        Докладвай
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Докладване на обявата"
        // A click on the dimmed area around the window closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-full max-w-md rounded-3xl bg-white p-0 text-left text-sm text-brand-ink shadow-2xl shadow-brand-ink/20 backdrop:bg-brand-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="relative p-6">
          <button
            type="button"
            aria-label="Затвори"
            onClick={() => dialogRef.current?.close()}
            className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-rose/10 hover:text-brand-rose"
          >
            <X className="size-5" aria-hidden />
          </button>

          {sent ? (
            <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CircleCheck className="size-7" aria-hidden />
              </span>
              <p className="text-lg font-bold">Сигналът е изпратен</p>
              <p className="text-brand-ink/70">Благодарим ти. Администраторът ще прегледа обявата.</p>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="mt-2 h-10 cursor-pointer rounded-xl bg-brand-rose px-6 font-semibold text-white transition-colors hover:bg-brand"
              >
                Затвори
              </button>
            </div>
          ) : (
            <form onSubmit={submit} onChange={() => setError(undefined)}>
              <h2 className="pr-8 text-lg font-bold">Докладвай обявата</h2>
              <p className="mt-1 text-brand-ink/70">Какво не е наред с нея? Сигналът отива при администратора.</p>

              <div role="radiogroup" aria-label="Причина" className="mt-4 space-y-1.5">
                {reasons.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 px-3.5 py-2.5 transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10"
                  >
                    <input type="radio" name="reason" value={value} className="size-4 shrink-0 cursor-pointer accent-brand-rose" />
                    {label}
                  </label>
                ))}
              </div>

              <textarea
                name="details"
                aria-label="Подробности"
                rows={3}
                maxLength={DETAILS_MAX}
                placeholder="Подробности (по желание)"
                className="scrollbar-soft mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 leading-5 transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose"
              />

              {error && (
                <p role="alert" className="mt-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-4 h-11 w-full cursor-pointer rounded-xl bg-brand-rose font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-60"
              >
                {busy ? "Изпращане…" : "Изпрати сигнала"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
