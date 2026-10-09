"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

type MessageButtonProps = {
  // What the conversation will be about: a "Търся" post or a listing.
  target: { requestId: string } | { listingId: string };
  className?: string;
};

// The "Съобщение" button on the page of a post or a listing: opens the conversation with whoever
// published it, where the message itself is written. Signed-out visitors get the login form.
export default function MessageButton({ target, className = "" }: MessageButtonProps) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const open = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      const result = await response.json();
      if (response.ok) return router.push(`/profile/messages/${result.id}`);
      setError(result.message);
    } catch {
      setError("Не успяхме да отворим разговора. Опитай отново.");
    }
    setBusy(false);
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={open}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-60"
      >
        <MessageSquare className="size-4.5" aria-hidden />
        Съобщение
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
