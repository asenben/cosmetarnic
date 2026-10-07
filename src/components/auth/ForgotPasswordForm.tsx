"use client";

import { useState, type SubmitEvent } from "react";
import { Mail, MailCheck } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, submitButton } from "@/components/auth/AuthParts";

type ForgotPasswordFormProps = {
  onLogin?: () => void;
};

export default function ForgotPasswordForm({ onLogin }: ForgotPasswordFormProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSentTo(String(new FormData(event.currentTarget).get("email")));
  };

  return (
    <div>
      <AuthHeader title="Забравена парола" />

      {sentTo === null ? (
        <>
          <p className="mt-3 text-center text-sm leading-5 text-brand-ink/70">
            Въведи имейла, с който си се регистрирал, и ще ти изпратим връзка за нова парола.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
            <AuthField label="Имейл" icon={Mail} type="email" name="email" autoComplete="email" />
            <button type="submit" className={submitButton}>
              Изпрати връзка
            </button>
          </form>
        </>
      ) : (
        <div role="status" className="mt-4 flex gap-3 rounded-xl bg-brand-rose/10 p-4 text-sm leading-5 text-brand-ink/80">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-rose" aria-hidden />
          <p>
            Ако има акаунт с имейл <span className="font-semibold text-brand-ink">{sentTo}</span>, изпратихме на него
            връзка за нова парола.
          </p>
        </div>
      )}

      <AuthSwitch question="Спомни си паролата?" action="Влез" onClick={onLogin} />
    </div>
  );
}
