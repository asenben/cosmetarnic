"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Pencil, RotateCcw, Trash2 } from "lucide-react";

const button =
  "flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

type ListingActionsProps = {
  id: string;
  // Whether the listing is marked as sold already.
  sold?: boolean;
  // Where to go once the listing is deleted; without it the page just reloads its list.
  afterDelete?: string;
  className?: string;
};

// The owner's buttons for a listing: one opens it in the form, one deletes it after asking once
// more, because a deleted listing cannot be brought back, and one marks it as sold or puts it back
// on sale.
export default function ListingActions({ id, sold = false, afterDelete, className = "" }: ListingActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string>();

  const remove = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      // 404 means it is gone already, e.g. deleted in another tab.
      if (response.ok || response.status === 404) {
        if (afterDelete) router.push(afterDelete);
        router.refresh();
        return;
      }
      setError((await response.json()).message);
    } catch {
      setError("Не успяхме да изтрием обявата. Опитай отново.");
    }
    setDeleting(false);
  };

  const changeSold = async () => {
    setChanging(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/listings/${id}/sold`, { method: sold ? "DELETE" : "PUT" });
      if (response.ok) router.refresh();
      else setError((await response.json()).message);
    } catch {
      setError("Не успяхме да запазим промяната. Опитай отново.");
    }
    setChanging(false);
  };

  return (
    <div className={className}>
      {/* Asked once more before deleting: the question appears over the buttons, and "Изтрий"
          itself becomes the button that confirms. */}
      {confirming && (
        <p role="alert" className="mb-2 flex items-start justify-between gap-3 text-sm text-brand-ink/80">
          Сигурен ли си, че искаш да изтриеш тази обява?
          <button
            type="button"
            disabled={deleting}
            onClick={() => setConfirming(false)}
            className="shrink-0 cursor-pointer font-semibold text-brand-ink/60 underline underline-offset-4 transition-colors hover:text-brand-rose"
          >
            Отказ
          </button>
        </p>
      )}
      <div className="flex gap-2">
        <Link href={`/sell/${id}`} className={`${button} border-brand-rose text-brand-rose hover:bg-brand-rose/10`}>
          <Pencil className="size-4" aria-hidden />
          Редактирай
        </Link>
        {confirming ? (
          <button
            type="button"
            disabled={deleting}
            onClick={remove}
            className={`${button} border-red-600 bg-red-600 text-white hover:bg-red-700`}
          >
            <Trash2 className="size-4" aria-hidden />
            {deleting ? "Изтриване…" : "Да, изтрий"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${button} border-red-600/40 text-red-600 hover:bg-red-600/10`}
          >
            <Trash2 className="size-4" aria-hidden />
            Изтрий
          </button>
        )}
      </div>
      <button
        type="button"
        disabled={changing}
        onClick={changeSold}
        className={`${button} mt-2 w-full flex-none ${
          sold
            ? "border-black/10 text-brand-ink hover:border-brand-rose/50"
            : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {sold ? <RotateCcw className="size-4" aria-hidden /> : <BadgeCheck className="size-4" aria-hidden />}
        {sold ? "Върни в продажба" : "Маркирай като продадена"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
