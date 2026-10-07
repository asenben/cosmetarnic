"use client";

import { useState, type SubmitEvent } from "react";
import { CircleCheck, Lock } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, submitButton } from "@/components/auth/AuthParts";

type ResetPasswordFormProps = {
  // The one-time token from the emailed reset link.
  token?: string;
  onLogin?: () => void;
};

export default function ResetPasswordForm({ token, onLogin }: ResetPasswordFormProps) {
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const mismatch = data.get("password") !== data.get("password_confirm");
    setPasswordMismatch(mismatch);
    if (!mismatch) setDone(true);
  };

  return (
    <div>
      <AuthHeader title="Нова парола" />

      {done ? (
        <>
          <div role="status" className="mt-4 flex gap-3 rounded-xl bg-brand-rose/10 p-4 text-sm leading-5 text-brand-ink/80">
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-rose" aria-hidden />
            <p>Паролата е сменена. Вече можеш да влезеш с новата си парола.</p>
          </div>
          <button type="button" onClick={onLogin} className={`${submitButton} mt-4`}>
            Към вход
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 text-center text-sm leading-5 text-brand-ink/70">
            Въведи новата си парола. Трябва да е поне 8 знака.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-2.5">
            {token && <input type="hidden" name="token" value={token} />}
            <AuthField
              label="Нова парола"
              icon={Lock}
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
            />
            <div>
              <AuthField
                label="Повтори паролата"
                icon={Lock}
                type="password"
                name="password_confirm"
                autoComplete="new-password"
                aria-invalid={passwordMismatch}
                onChange={() => setPasswordMismatch(false)}
              />
              {passwordMismatch && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  Паролите не съвпадат.
                </p>
              )}
            </div>
            <button type="submit" className={submitButton}>
              Запази паролата
            </button>
          </form>
          <AuthSwitch question="Спомни си паролата?" action="Влез" onClick={onLogin} />
        </>
      )}
    </div>
  );
}