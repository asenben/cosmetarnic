"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode, type SubmitEvent } from "react";
import { CircleCheck, Link2, Lock, Monitor, Shield, Smartphone, Trash2, type LucideIcon } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/components/auth/AuthProvider";

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

// A session as the page shows it: the device worked out from the browser's User-Agent on the
// server, and the sign-in time already formatted, so server and browser render the same text.
export type SessionRow = {
  id: string;
  device: string;
  mobile: boolean;
  signedIn: string;
  current: boolean;
};

const button =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const solid = `${button} border-brand-rose bg-brand-rose text-white hover:border-brand hover:bg-brand`;
const outline = `${button} border-brand-rose/50 text-brand-rose hover:bg-brand-rose/10 disabled:hover:bg-transparent`;

const field =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

type RowProps = { icon: LucideIcon; title: string; hint: string; action?: ReactNode; children?: ReactNode };

function Row({ icon: Icon, title, hint, action, children }: RowProps) {
  return (
    <section className="rounded-2xl border border-black/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="text-base font-bold text-brand-ink">{title}</h2>
          <p className="text-sm text-brand-ink/60">{hint}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ field?: string; message: string }>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("password_confirm")) {
      setError({ field: "password_confirm", message: "Паролите не съвпадат." });
      return;
    }

    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (response.ok) {
        form.reset();
        setOpen(false);
        setDone(true);
      } else {
        const result = await response.json();
        setError({ field: result.field, message: result.message ?? GENERIC_ERROR });
      }
    } catch {
      setError({ message: GENERIC_ERROR });
    } finally {
      setPending(false);
    }
  };

  const inputs = [
    { name: "current_password", label: "Текуща парола", autoComplete: "current-password" },
    { name: "password", label: "Нова парола", autoComplete: "new-password" },
    { name: "password_confirm", label: "Повтори новата парола", autoComplete: "new-password" },
  ];

  return (
    <Row
      icon={Lock}
      title="Промяна на паролата"
      hint="Използвай силна парола, за да защитиш своя профил."
      action={
        !open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}
            className={solid}
          >
            Промени паролата
          </button>
        )
      }
    >
      {done && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CircleCheck className="size-4.5" aria-hidden />
          Паролата е сменена. Изписахме те от останалите устройства.
        </p>
      )}
      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
          {inputs.map(({ name, label, autoComplete }) => (
            <div key={name}>
              <input
                type="password"
                name={name}
                aria-label={label}
                placeholder={label}
                autoComplete={autoComplete}
                required
                minLength={name === "current_password" ? undefined : 8}
                aria-invalid={error?.field === name}
                onChange={() => setError(undefined)}
                className={field}
              />
              {error?.field === name && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {error.message}
                </p>
              )}
            </div>
          ))}
          {error && !error.field && (
            <p role="alert" className="text-sm text-red-600 sm:col-span-3">
              {error.message}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 sm:col-span-3">
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className={outline}>
              Отказ
            </button>
            <button type="submit" disabled={pending} className={solid}>
              {pending ? "Запазване…" : "Запази новата парола"}
            </button>
          </div>
        </form>
      )}
    </Row>
  );
}

function Sessions({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [ending, setEnding] = useState<string>();
  const [error, setError] = useState<string>();

  const end = async (id: string) => {
    setEnding(id);
    setError(undefined);
    try {
      const response = await fetch(`/api/profile/sessions/${id}`, { method: "DELETE" });
      // 404 means the session ended in the meantime (signed out there, or expired) and the list on
      // screen is out of date: the device is signed out either way, so the list is just reloaded.
      if (response.ok || response.status === 404) router.refresh();
      else setError((await response.json()).message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setEnding(undefined);
    }
  };

  return (
    <Row icon={Monitor} title="Активни сесии" hint="Прегледай устройствата, на които си влязъл в профила си.">
      <ul className="mt-4 divide-y divide-black/5 rounded-xl bg-zinc-50 px-4">
        {sessions.map(({ id, device, mobile, signedIn, current }) => {
          const Icon = mobile ? Smartphone : Monitor;
          return (
            <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <Icon className="size-5 shrink-0 text-brand-ink/70" aria-hidden />
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium text-brand-ink">{device}</p>
                <p className="text-xs text-brand-ink/60">{current ? "В момента" : `Вход на ${signedIn}`}</p>
              </div>
              {current ? (
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Текуща сесия
                </span>
              ) : (
                <button
                  type="button"
                  disabled={ending !== undefined}
                  onClick={() => end(id)}
                  className={`${outline} h-9 bg-white px-4 text-xs`}
                >
                  {ending === id ? "Излизане…" : "Изход от това устройство"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </Row>
  );
}

function DeleteAccount() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: new FormData(event.currentTarget).get("password") }),
      });
      if (response.ok) {
        // The account and its session are gone; this only clears the signed-in state and goes home.
        await logout();
        return;
      }
      setError((await response.json()).message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    }
    setPending(false);
  };

  return (
    <Row
      icon={Trash2}
      title="Изтриване на профила"
      hint="Това действие е необратимо. Всички твои данни ще бъдат изтрити."
      action={
        !open && (
          <button type="button" onClick={() => setOpen(true)} className={outline}>
            Изтрий профила
          </button>
        )
      }
    >
      {open && (
        <form onSubmit={onSubmit} className="mt-4 rounded-xl bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Профилът, снимката ти и всичко свързано с тях ще бъдат изтрити завинаги. Въведи паролата си, за да
            потвърдиш.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              type="password"
              name="password"
              aria-label="Парола"
              placeholder="Парола"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(error)}
              onChange={() => setError(undefined)}
              className={`${field} max-w-xs`}
            />
            <button
              type="submit"
              disabled={pending}
              className={`${button} border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700`}
            >
              {pending ? "Изтриване…" : "Изтрий завинаги"}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className={`${outline} bg-white`}>
              Отказ
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      )}
    </Row>
  );
}

const soon = "Очаквай скоро";

export default function SecuritySettings({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div role="tabpanel" className="mt-5 space-y-4">
      <ChangePassword />

      <Row
        icon={Shield}
        title="Двустепенно удостоверяване (2FA)"
        hint="Допълнителна защита за твоя профил чрез код от приложение."
        action={
          <button type="button" disabled title={soon} className={outline}>
            Включи 2FA
          </button>
        }
      >
        <p className="mt-2 flex items-center gap-2 pl-15 text-sm text-brand-ink/70">
          <span className="size-2.5 rounded-full bg-zinc-300" aria-hidden />
          Изключено · {soon.toLowerCase()}
        </p>
      </Row>

      <Sessions sessions={sessions} />

      <Row icon={Link2} title="Свързани акаунти" hint="Управлявай свързаните с профила ти социални акаунти.">
        <ul className="mt-4 divide-y divide-black/5 rounded-xl bg-zinc-50 px-4">
          {[
            { name: "Google", icon: <FcGoogle className="size-5" aria-hidden /> },
            { name: "Facebook", icon: <FaFacebook className="size-5 text-facebook" aria-hidden /> },
          ].map(({ name, icon }) => (
            <li key={name} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              {icon}
              <p className="w-24 text-sm font-medium text-brand-ink">{name}</p>
              <p className="flex-1 text-sm text-brand-ink/60">Не е свързан</p>
              <button type="button" disabled title={soon} className={`${outline} h-9 bg-white px-4 text-xs`}>
                Свържи
              </button>
            </li>
          ))}
        </ul>
      </Row>

      <DeleteAccount />
    </div>
  );
}
