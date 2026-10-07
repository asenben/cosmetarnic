"use client";

import { useState, type SubmitEvent } from "react";
import { Lock, User } from "lucide-react";
import { AuthField, AuthHeader, AuthSwitch, SocialLogin, submitButton } from "@/components/auth/AuthParts";
import type { SessionUser } from "@/lib/auth/session";

type LoginFormProps = {
  // Shown above the fields, e.g. the outcome of opening an email confirmation link.
  notice?: { kind: "success" | "error"; text: string };
  onSuccess?: (user: SessionUser) => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
};

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

export default function LoginForm({ notice, onSuccess, onForgotPassword, onRegister }: LoginFormProps) {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          password: data.get("password"),
          remember: data.get("remember") === "on",
        }),
      });
      const result = await response.json();
      if (response.ok) onSuccess?.(result.user);
      else setError(result.message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <AuthHeader title="Вход" />

      {notice && (
        <p
          role="status"
          className={`mt-3 rounded-xl px-3 py-2 text-center text-sm ${
            notice.kind === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-3 space-y-2.5">
        <AuthField
          label="Потребителско име"
          icon={User}
          name="username"
          autoComplete="username"
          aria-invalid={Boolean(error)}
          onChange={() => setError(undefined)}
        />
        <AuthField
          label="Парола"
          icon={Lock}
          type="password"
          name="password"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          onChange={() => setError(undefined)}
          action={
            <button
              type="button"
              onClick={onForgotPassword}
              className="cursor-pointer text-[13px] leading-4 font-medium text-brand-rose transition-colors hover:text-brand"
            >
              Забравена парола?
            </button>
          }
        />

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-ink/70">
          <input type="checkbox" name="remember" className="size-4 shrink-0 cursor-pointer accent-brand-rose" />
          Запази паролата
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className={`${submitButton} disabled:cursor-wait disabled:opacity-70`}>
          {pending ? "Влизане…" : "Вход"}
        </button>
      </form>

      <SocialLogin />
      <AuthSwitch question="Нямаш акаунт?" action="Регистрирай се" onClick={onRegister} />
    </div>
  );
}
