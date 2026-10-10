"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

const button =
  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

type RequestActionsProps = {
  id: string;
  // Where to go once the post is deleted; without it the page just reloads its list.
  afterDelete?: string;
  className?: string;
};

// The buttons for a "Търся" post in the administrator's lists: one opens it in the form, the
// other deletes it after asking once more.
export default function RequestActions({ id, afterDelete, className = "" }: RequestActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const remove = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/requests/${id}`, { method: "DELETE" });
      // 404 means it is gone already, e.g. deleted in another tab.
      if (response.ok || response.status === 404) {
        if (afterDelete) router.push(afterDelete);
        router.refresh();
        return;
      }
      setError((await response.json()).message);
    } catch {
      setError("Не успяхме да изтрием публикацията. Опитай отново.");
    }
    setDeleting(false);
  };

  return (
    <div className={className}>
      {confirming && (
        <p role="alert" className="mb-2 flex items-start justify-between gap-3 text-xs text-brand-ink/80">
          Сигурен ли си, че искаш да изтриеш тази публикация?
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
        {!confirming && (
          <Link
            href={`/request/${id}`}
            className={`${button} min-w-0 flex-1 border-brand-rose text-brand-rose hover:bg-brand-rose/10`}
          >
            <Pencil className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Редактирай</span>
          </Link>
        )}
        {confirming ? (
          <button
            type="button"
            disabled={deleting}
            onClick={remove}
            className={`${button} flex-1 border-red-600 bg-red-600 text-white hover:bg-red-700`}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            {deleting ? "Изтриване…" : "Да, изтрий"}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Изтрий"
            title="Изтрий"
            onClick={() => setConfirming(true)}
            className={`${button} w-10 shrink-0 border-red-600/40 text-red-600 hover:bg-red-600/10`}
          >
            <Trash2 className="size-4" aria-hidden />
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
