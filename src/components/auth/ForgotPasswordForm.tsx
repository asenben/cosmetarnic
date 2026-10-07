"use client";

import { useState, type SubmitEvent } from "react";
import { Mail, MailCheck } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, submitButton } from "@/components/auth/AuthParts";

type ForgotPasswordFormProps = {
  onLogin?: () => void;
};

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

export default function ForgotPasswordForm({ onLogin }: ForgotPasswordFormProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();

    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) setSentTo(email);
      else setError((await response.json()).message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
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
            <AuthField
              label="Имейл"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              aria-invalid={Boolean(error)}
              onChange={() => setError(undefined)}
            />
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={`${submitButton} disabled:cursor-wait disabled:opacity-70`}
            >
              {pending ? "Изпращане…" : "Изпрати връзка"}
            </button>
          </form>
        </>
      ) : (
        <div role="status" className="mt-4 flex gap-3 rounded-xl bg-brand-rose/10 p-4 text-sm leading-5 text-brand-ink/80">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-rose" aria-hidden />
          <p>
            Ако има акаунт с имейл <span className="font-semibold text-brand-ink">{sentTo}</span>, изпратихме на него
            връзка за нова парола. Тя е валидна 60 минути.
          </p>
        </div>
      )}

      <AuthSwitch question="Спомни си паролата?" action="Влез" onClick={onLogin} />
    </div>
  );
}
