"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { Ban, CircleCheck, Save, ShieldCheck, ShieldOff, Trash2, Undo2 } from "lucide-react";

// The account's details as the form starts with them.
export type ManagedUser = {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  city: string;
  bio: string;
  role: string;
  blocked: boolean;
};

const BIO_MAX = 500;
const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

const field =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";
const action =
  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-60";

type UserManagerProps = {
  user: ManagedUser;
  // The administrator's own account: its details can be edited here, but it cannot be blocked,
  // demoted or deleted from the panel.
  own: boolean;
};

// What the administrator can do with an account: change its details, block or unblock it, give
// or take away the administrator's rights, and delete it.
export default function UserManager({ user, own }: UserManagerProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  // Which request is on its way, so its button can say so and the others wait.
  const [busy, setBusy] = useState<"details" | "blocked" | "role" | "delete">();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>();

  // Sends one change and answers whether it went through.
  const send = async (kind: NonNullable<typeof busy>, init: RequestInit) => {
    setBusy(kind);
    setMessage(undefined);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, init);
      if (response.ok) return true;
      const result = await response.json().catch(() => ({}));
      if (result.errors) setErrors(result.errors);
      setMessage(result.message ?? GENERIC_ERROR);
    } catch {
      setMessage("Провери връзката си и опитай отново.");
    } finally {
      setBusy(undefined);
    }
    return false;
  };

  const patch = (kind: NonNullable<typeof busy>, body: unknown) =>
    send(kind, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    const data = new FormData(event.currentTarget);
    const details = Object.fromEntries(["username", "full_name", "phone", "city", "bio"].map((name) => [name, data.get(name)]));
    if (await patch("details", { details })) {
      setSaved(true);
      router.refresh();
    }
  };

  const change = async (kind: "blocked" | "role", body: unknown) => {
    if (await patch(kind, body)) router.refresh();
  };

  const remove = async () => {
    if (await send("delete", { method: "DELETE" })) {
      router.push("/admin/users");
      router.refresh();
    }
  };

  const label = (text: string, error?: string) => (
    <span className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-brand-ink">
      {text}
      {error && (
        <span role="alert" className="text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </span>
  );

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-brand-ink">Управление на профила</h2>

      <form
        onSubmit={onSubmit}
        onChange={() => {
          setSaved(false);
          setMessage(undefined);
        }}
        className="mt-4 grid gap-4 sm:grid-cols-2"
      >
        <label className="block">
          {label("Потребителско име", errors.username)}
          <input name="username" defaultValue={user.username} maxLength={30} aria-invalid={Boolean(errors.username)} className={field} />
        </label>
        <label className="block">
          {label("Име и фамилия")}
          <input name="full_name" defaultValue={user.fullName} maxLength={80} className={field} />
        </label>
        <label className="block">
          {label("Телефон", errors.phone)}
          <input name="phone" type="tel" defaultValue={user.phone} maxLength={20} aria-invalid={Boolean(errors.phone)} className={field} />
        </label>
        <label className="block">
          {label("Град")}
          <input name="city" defaultValue={user.city} maxLength={60} className={field} />
        </label>
        <label className="block sm:col-span-2">
          {label("За мен", errors.bio)}
          <textarea
            name="bio"
            defaultValue={user.bio}
            rows={3}
            maxLength={BIO_MAX}
            aria-invalid={Boolean(errors.bio)}
            className={`${field} scrollbar-soft h-auto resize-y py-2.5 leading-6`}
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy !== undefined}
            className={`${action} text-white ${
              saved ? "border-emerald-600 bg-emerald-600" : "border-brand-rose bg-brand-rose hover:border-brand hover:bg-brand"
            }`}
          >
            {saved ? <CircleCheck className="size-4.5" aria-hidden /> : <Save className="size-4.5" aria-hidden />}
            <span role="status">{busy === "details" ? "Запазване…" : saved ? "Промените са запазени" : "Запази промените"}</span>
          </button>
        </div>
      </form>

      {/* The rest changes what the account may do, so none of it applies to the administrator's own. */}
      {!own && (
        <div className="mt-6 border-t border-black/5 pt-5">
          {user.blocked && (
            <p className="mb-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              Профилът е блокиран: не може да влиза, а обявите и публикациите му не се виждат в сайта.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== undefined}
              onClick={() => change("blocked", { blocked: !user.blocked })}
              className={`${action} border-black/10 text-brand-ink hover:border-brand-rose/50`}
            >
              {user.blocked ? <Undo2 className="size-4" aria-hidden /> : <Ban className="size-4" aria-hidden />}
              {busy === "blocked" ? "Момент…" : user.blocked ? "Отблокирай" : "Блокирай"}
            </button>
            <button
              type="button"
              disabled={busy !== undefined}
              onClick={() => change("role", { role: user.role === "admin" ? "user" : "admin" })}
              className={`${action} border-black/10 text-brand-ink hover:border-brand-rose/50`}
            >
              {user.role === "admin" ? <ShieldOff className="size-4" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
              {busy === "role" ? "Момент…" : user.role === "admin" ? "Махни администраторските права" : "Направи администратор"}
            </button>
            {confirming ? (
              <button
                type="button"
                disabled={busy !== undefined}
                onClick={remove}
                className={`${action} border-red-600 bg-red-600 text-white hover:bg-red-700`}
              >
                <Trash2 className="size-4" aria-hidden />
                {busy === "delete" ? "Изтриване…" : "Да, изтрий профила"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy !== undefined}
                onClick={() => setConfirming(true)}
                className={`${action} border-red-600/40 text-red-600 hover:bg-red-600/10`}
              >
                <Trash2 className="size-4" aria-hidden />
                Изтрий профила
              </button>
            )}
          </div>

          {confirming && (
            <p role="alert" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-ink/80">
              Сигурен ли си? Профилът се изтрива завинаги заедно с обявите, публикациите и съобщенията му.
              <button
                type="button"
                disabled={busy !== undefined}
                onClick={() => setConfirming(false)}
                className="cursor-pointer font-semibold text-brand-ink/60 underline underline-offset-4 transition-colors hover:text-brand-rose"
              >
                Отказ
              </button>
            </p>
          )}
        </div>
      )}

      {message && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {message}
        </p>
      )}
    </section>
  );
}
