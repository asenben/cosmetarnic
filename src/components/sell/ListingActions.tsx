"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheck, Pencil, Trash2 } from "lucide-react";

const button =
  "flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

type ListingActionsProps = {
  id: string;
  // Where to go once the listing is deleted; without it the page just reloads its list.
  afterDelete?: string;
  // Whether deleting asks if the product was sold, for the owner's earnings. Left off for an
  // administrator deleting somebody else's listing.
  askSold?: boolean;
  className?: string;
};

// The owner's buttons for a listing: one opens it in the form, the other deletes it after asking
// once more, because a deleted listing cannot be brought back. A listing whose product has been
// sold is deleted too: the owner says so on the way, and its price counts towards their earnings
// on "Моят профил".
export default function ListingActions({ id, afterDelete, askSold = true, className = "" }: ListingActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const remove = async (sold: boolean) => {
    setDeleting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sold }),
      });
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

  return (
    // A container, so the buttons can tell when they are under a narrow card (four listings
    // across, or two on a phone) and shorten themselves to fit.
    <div className={`@container ${className}`}>
      {/* Asked once more before deleting: the question appears over the buttons, and "Изтрий"
          itself becomes the button that confirms. */}
      {confirming && (
        <p role="alert" className="mb-2 flex items-start justify-between gap-3 text-sm text-brand-ink/80 @max-[16rem]:flex-col @max-[16rem]:gap-1 @max-[16rem]:text-xs">
          {askSold ? "Продаде ли продукта?" : "Сигурен ли си, че искаш да изтриеш тази обява?"}
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
        {/* Under a narrow card it steps aside while "Да, изтрий" needs the room; while asking
            whether the product was sold, its two answers take the whole row. */}
        <Link
          href={`/sell/${id}`}
          className={`${button} min-w-0 border-brand-rose text-brand-rose hover:bg-brand-rose/10 @max-[16rem]:text-xs ${
            confirming ? (askSold ? "hidden" : "@max-[16rem]:hidden") : ""
          }`}
        >
          <Pencil className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Редактирай</span>
        </Link>
        {confirming && askSold ? (
          <>
            <button
              type="button"
              disabled={deleting}
              onClick={() => remove(true)}
              className={`${button} min-w-0 border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 @max-[16rem]:text-xs`}
            >
              <CircleCheck className="size-4 shrink-0 @max-[16rem]:hidden" aria-hidden />
              <span className="truncate">Да, продадено</span>
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => remove(false)}
              className={`${button} min-w-0 border-red-600 bg-red-600 text-white hover:bg-red-700 @max-[16rem]:text-xs`}
            >
              <Trash2 className="size-4 shrink-0 @max-[16rem]:hidden" aria-hidden />
              <span className="truncate">{deleting ? "Изтриване…" : "Не, само изтрий"}</span>
            </button>
          </>
        ) : confirming ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => remove(false)}
            className={`${button} border-red-600 bg-red-600 text-white hover:bg-red-700 @max-[16rem]:text-xs`}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            {deleting ? "Изтриване…" : "Да, изтрий"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Изтрий"
            title="Изтрий"
            // Under a narrow card only the bin is shown, as a small square button.
            className={`${button} border-red-600/40 text-red-600 hover:bg-red-600/10 @max-[16rem]:w-10 @max-[16rem]:flex-none`}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            <span className="@max-[16rem]:hidden">Изтрий</span>
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
