"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { CircleCheck, Lock, Mail, User } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, SocialLogin, submitButton, textLink } from "@/components/auth/AuthParts";
import type { RegisterErrors, RegisterField } from "@/lib/auth/register";

type RegisterFormProps = {
  onLogin?: () => void;
};

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

export default function RegisterForm({ onLogin }: RegisterFormProps) {
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [registered, setRegistered] = useState<{ email: string; emailSent: boolean }>();

  const clearError = (field: RegisterField) => () => {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("password_confirm")) {
      setErrors({ password_confirm: "Паролите не съвпадат." });
      return;
    }

    setPending(true);
    setFormError(undefined);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          email: data.get("email"),
          password: data.get("password"),
          password_confirm: data.get("password_confirm"),
          terms: data.get("terms") === "on",
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setRegistered({ email: result.user.email, emailSent: result.emailSent });
      } else if (result.errors) {
        setErrors(result.errors);
      } else {
        setFormError(result.message ?? GENERIC_ERROR);
      }
    } catch {
      setFormError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  };

  const fieldError = (field: RegisterField) =>
    errors[field] && (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {errors[field]}
      </p>
    );

  if (registered) {
    return (
      <div>
        <AuthHeader title="Регистрация" />
        <div role="status" className="mt-4 flex gap-3 rounded-xl bg-brand-rose/10 p-4 text-sm leading-5 text-brand-ink/80">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-rose" aria-hidden />
          <p>
            Профилът е създаден успешно.{" "}
            {registered.emailSent ? (
              <>
                Изпратихме връзка за потвърждение на{" "}
                <span className="font-semibold text-brand-ink">{registered.email}</span>. Отвори я, за да влезеш в
                профила си.
              </>
            ) : (
              "Не успяхме да изпратим имейла за потвърждение. Опитай да влезеш и ще ти изпратим нов."
            )}
          </p>
        </div>
        <button type="button" onClick={onLogin} className={`${submitButton} mt-4`}>
          Към вход
        </button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title="Регистрация" />

      <form onSubmit={onSubmit} className="mt-3 space-y-2.5">
        <div>
          <AuthField
            label="Потребителско име"
            icon={User}
            name="username"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            aria-invalid={Boolean(errors.username)}
            onChange={clearError("username")}
          />
          {fieldError("username")}
        </div>
        <div>
          <AuthField
            label="Имейл"
            icon={Mail}
            type="email"
            name="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            onChange={clearError("email")}
          />
          {fieldError("email")}
        </div>
        <div>
          <AuthField
            label="Парола"
            icon={Lock}
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(errors.password)}
            onChange={clearError("password")}
          />
          {fieldError("password")}
        </div>
        <div>
          <AuthField
            label="Повтори паролата"
            icon={Lock}
            type="password"
            name="password_confirm"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirm)}
            onChange={clearError("password_confirm")}
          />
          {fieldError("password_confirm")}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-4 text-brand-ink/70">
            <input
              type="checkbox"
              name="terms"
              required
              onChange={clearError("terms")}
              className="size-4 shrink-0 cursor-pointer accent-brand-rose"
            />
            <span>
              Съгласен съм с{" "}
              <Link href="/terms" className={textLink}>
                Правилата и условията
              </Link>{" "}
              и{" "}
              <Link href="/privacy" className={textLink}>
                Политиката за поверителност
              </Link>
            </span>
          </label>
          {fieldError("terms")}
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {formError}
          </p>
        )}

        <button type="submit" disabled={pending} className={`${submitButton} disabled:cursor-wait disabled:opacity-70`}>
          {pending ? "Създаване на профил…" : "Регистрация"}
        </button>
      </form>

      <SocialLogin />
      <AuthSwitch question="Вече имаш акаунт?" action="Влез" onClick={onLogin} />
    </div>
  );
}
