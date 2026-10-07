"use client";

import { useState, type SubmitEvent } from "react";
import { CircleCheck, Lock } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, submitButton } from "@/components/auth/AuthParts";

type ResetPasswordFormProps = {
  // The one-time token from the emailed reset link.
  token?: string;
  onLogin?: () => void;
};

type Field = "password" | "password_confirm";

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

export default function ResetPasswordForm({ token, onLogin }: ResetPasswordFormProps) {
  const [fieldError, setFieldError] = useState<{ field: Field; message: string }>();
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const clearErrors = () => {
    setFieldError(undefined);
    setFormError(undefined);
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("password_confirm")) {
      setFieldError({ field: "password_confirm", message: "Паролите не съвпадат." });
      return;
    }

    setPending(true);
    clearErrors();
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.get("password"),
          password_confirm: data.get("password_confirm"),
        }),
      });
      if (response.ok) {
        setDone(true);
        return;
      }
      const result = await response.json();
      if (result.field) setFieldError({ field: result.field, message: result.message });
      else setFormError(result.message ?? GENERIC_ERROR);
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  };

  const errorFor = (field: Field) =>
    fieldError?.field === field && (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {fieldError.message}
      </p>
    );

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
            <div>
              <AuthField
                label="Нова парола"
                icon={Lock}
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                aria-invalid={fieldError?.field === "password"}
                onChange={clearErrors}
              />
              {errorFor("password")}
            </div>
            <div>
              <AuthField
                label="Повтори паролата"
                icon={Lock}
                type="password"
                name="password_confirm"
                autoComplete="new-password"
                aria-invalid={fieldError?.field === "password_confirm"}
                onChange={clearErrors}
              />
              {errorFor("password_confirm")}
            </div>
            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={`${submitButton} disabled:cursor-wait disabled:opacity-70`}
            >
              {pending ? "Запазване…" : "Запази паролата"}
            </button>
          </form>
          <AuthSwitch question="Спомни си паролата?" action="Влез" onClick={onLogin} />
        </>
      )}
    </div>
  );
}
