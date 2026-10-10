"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { DEFAULT_CATEGORY_ICON, categoryIcon, categoryIcons } from "@/data/categoryIcons";

// A category with how much is published in it.
export type ManagedCategory = { value: string; label: string; icon: string; listings: number; requests: number };

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

const nameField =
  "h-11 min-w-0 flex-1 basis-56 rounded-xl border border-black/10 bg-white px-3.5 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";
const smallButton =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:cursor-default disabled:opacity-40";
const quiet = `${smallButton} border-black/10 text-brand-ink/70 hover:border-brand-rose/50 hover:text-brand-rose disabled:hover:border-black/10 disabled:hover:text-brand-ink/70`;

type IconPickerProps = { name: string; value: string; onChange: (icon: string) => void };

// The pictures a category can have, one of them chosen.
function IconPicker({ name, value, onChange }: IconPickerProps) {
  return (
    <div role="radiogroup" aria-label="Икона" className="flex flex-wrap gap-1.5">
      {Object.entries(categoryIcons).map(([icon, Icon]) => (
        <label
          key={icon}
          title={icon}
          className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-white text-brand-ink/70 transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10 has-checked:text-brand-rose has-focus-visible:ring-2 has-focus-visible:ring-brand-rose/40"
        >
          <input
            type="radio"
            name={name}
            value={icon}
            checked={value === icon}
            onChange={() => onChange(icon)}
            className="sr-only"
          />
          <Icon className="size-5" aria-hidden />
          <span className="sr-only">{icon}</span>
        </label>
      ))}
    </div>
  );
}

// The administrator's page for the categories: the form for a new one, and the ones the site
// has, each of which can be renamed, given another picture, moved up or down, or removed.
export default function CategoryManager({ categories }: { categories: ManagedCategory[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  // The category being renamed, with what has been typed and picked for it so far.
  const [editing, setEditing] = useState<{ value: string; label: string; icon: string }>();
  // The category whose removal is being asked about.
  const [confirming, setConfirming] = useState<string>();
  // What went wrong with a change to one of the categories in the list.
  const [rowError, setRowError] = useState<{ value: string; message: string }>();

  // Sends one request and answers whether it went through; `onFail` gets what to tell the user.
  const send = async (url: string, init: RequestInit, onFail: (message: string) => void) => {
    if (busy) return false;
    setBusy(true);
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        router.refresh();
        return true;
      }
      onFail((await response.json().catch(() => ({}))).message ?? GENERIC_ERROR);
    } catch {
      onFail("Провери връзката си и опитай отново.");
    } finally {
      setBusy(false);
    }
    return false;
  };

  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const address = (value: string) => `/api/admin/categories/${encodeURIComponent(value)}`;
  const failRow = (value: string) => (message: string) => setRowError({ value, message });

  const add = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    if (await send("/api/admin/categories", json("POST", { label, icon }), setError)) {
      setLabel("");
      setIcon(DEFAULT_CATEGORY_ICON);
    }
  };

  const save = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setRowError(undefined);
    const done = await send(
      address(editing.value),
      json("PATCH", { label: editing.label, icon: editing.icon }),
      failRow(editing.value),
    );
    if (done) setEditing(undefined);
  };

  const move = (value: string, direction: "up" | "down") => {
    setRowError(undefined);
    send(address(value), json("PATCH", { move: direction }), failRow(value));
  };

  const remove = async (value: string) => {
    setRowError(undefined);
    if (await send(address(value), { method: "DELETE" }, failRow(value))) setConfirming(undefined);
  };

  return (
    <>
      <form onSubmit={add} className="mt-5 rounded-2xl bg-brand-rose/5 p-4">
        <h2 className="text-sm font-bold text-brand-ink">Нова категория</h2>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <input
            value={label}
            onChange={(event) => {
              setLabel(event.target.value);
              setError(undefined);
            }}
            aria-label="Име на категорията"
            maxLength={40}
            placeholder="напр. Грижа за тялото"
            aria-invalid={Boolean(error)}
            className={nameField}
          />
          <button
            type="submit"
            disabled={busy || label.trim().length < 2}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-rose px-5 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-50 disabled:hover:bg-brand-rose"
          >
            <Plus className="size-4.5" aria-hidden />
            Добави
          </button>
        </div>

        <p className="mt-3 mb-1.5 text-xs font-semibold text-brand-ink/60">Икона</p>
        <IconPicker name="icon" value={icon} onChange={setIcon} />

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </form>

      <ul className="mt-4 divide-y divide-black/5">
        {categories.map(({ value, label: name, icon: iconName, listings, requests }, index) => {
          const Icon = categoryIcon(iconName);
          const used = listings + requests > 0;
          const problem = rowError?.value === value ? rowError.message : undefined;

          if (editing?.value === value) {
            return (
              <li key={value} className="py-3">
                <form onSubmit={save} aria-label={`Промяна на „${name}“`}>
                  <div className="flex flex-wrap items-start gap-2">
                    <input
                      value={editing.label}
                      onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                      aria-label="Име на категорията"
                      maxLength={40}
                      autoFocus
                      aria-invalid={Boolean(problem)}
                      className={nameField}
                    />
                    <button
                      type="submit"
                      disabled={busy || editing.label.trim().length < 2}
                      className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-rose px-4 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-50"
                    >
                      <Check className="size-4.5" aria-hidden />
                      Запази
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(undefined);
                        setRowError(undefined);
                      }}
                      className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-rose/50"
                    >
                      <X className="size-4.5" aria-hidden />
                      Отказ
                    </button>
                  </div>
                  <div className="mt-2.5">
                    <IconPicker
                      name={`icon-${value}`}
                      value={editing.icon}
                      onChange={(picked) => setEditing({ ...editing, icon: picked })}
                    />
                  </div>
                  {problem && (
                    <p role="alert" className="mt-2 text-xs text-red-600">
                      {problem}
                    </p>
                  )}
                </form>
              </li>
            );
          }

          return (
            <li key={value} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-ink">{name}</p>
                <p className="truncate text-xs text-brand-ink/60">
                  {listings} обяви · {requests} в „Търся“
                </p>
                {problem && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {problem}
                  </p>
                )}
              </div>

              {confirming === value ? (
                <span className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(value)}
                    className="flex h-9 cursor-pointer items-center rounded-xl bg-red-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    Да, изтрий
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirming(undefined)}
                    className="h-9 cursor-pointer rounded-xl border border-black/10 px-3.5 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-rose/50"
                  >
                    Отказ
                  </button>
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Премести „${name}“ нагоре`}
                    title="Нагоре"
                    disabled={busy || index === 0}
                    onClick={() => move(value, "up")}
                    className={quiet}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Премести „${name}“ надолу`}
                    title="Надолу"
                    disabled={busy || index === categories.length - 1}
                    onClick={() => move(value, "down")}
                    className={quiet}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Промени „${name}“`}
                    title="Преименувай или смени иконата"
                    disabled={busy}
                    onClick={() => {
                      setEditing({ value, label: name, icon: iconName });
                      setConfirming(undefined);
                      setRowError(undefined);
                    }}
                    className={quiet}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  {/* A category something is published in stays, so nothing is left without one. */}
                  <button
                    type="button"
                    aria-label={`Изтрий категорията „${name}“`}
                    title={used ? "Използва се и не може да се изтрие" : "Изтрий"}
                    disabled={busy || used}
                    onClick={() => {
                      setConfirming(value);
                      setRowError(undefined);
                    }}
                    className={`${smallButton} border-red-600/40 text-red-600 hover:bg-red-600/10 disabled:hover:bg-transparent`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
