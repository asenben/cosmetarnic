import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Съобщения",
};

export default function ProfileMessages() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-brand-ink sm:text-3xl">Съобщения</h1>
      <p className="mt-1 text-sm text-brand-ink/60">Разговорите ти с купувачи и продавачи.</p>

      <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-brand-ink/60">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <MessageSquare className="size-7" aria-hidden />
        </span>
        Все още нямаш съобщения.
      </div>
    </div>
  );
}
