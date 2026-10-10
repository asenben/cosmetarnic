"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { ArrowDown, ArrowUp, Check, CircleCheck, MapPin, Pencil, Plus, Save, Trash2, X } from "lucide-react";

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

const field =
  "h-11 min-w-0 rounded-xl border border-black/10 bg-white px-3.5 text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";
const smallButton =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:cursor-default disabled:opacity-40";
const quiet = `${smallButton} border-black/10 text-brand-ink/70 hover:border-brand-rose/50 hover:text-brand-rose disabled:hover:border-black/10 disabled:hover:text-brand-ink/70`;
const noSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

// Sends one change to the panel's API and answers with what went wrong, or nothing when it
// went through.
async function request(url: string, method: string, body?: unknown): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      method,
      ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    if (response.ok) return undefined;
    return (await response.json().catch(() => ({}))).message ?? GENERIC_ERROR;
  } catch {
    return "Провери връзката си и опитай отново.";
  }
}

// The ends of the price slider in the filters of "Продавалник" and "Търся".
export function PriceRangeForm({ min, max }: { min: number; max: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    const problem = await request("/api/admin/price-range", "PUT", {
      min: Number(data.get("min")),
      max: Number(data.get("max")),
    });
    setBusy(false);
    setError(problem);
    if (!problem) {
      setSaved(true);
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={save}
      onChange={() => {
        setSaved(false);
        setError(undefined);
      }}
      className="mt-4 flex flex-wrap items-end gap-3"
    >
      {[
        { name: "min", label: "От", value: min },
        { name: "max", label: "До", value: max },
      ].map(({ name, label, value }) => (
        <label key={name} className="text-xs font-semibold text-brand-ink/60">
          {label}
          <span className="relative mt-1.5 block">
            <input
              type="number"
              name={name}
              defaultValue={value}
              min={0}
              step={1}
              required
              aria-invalid={Boolean(error)}
              className={`${field} ${noSpinner} w-36 pr-8 font-semibold`}
            />
            <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-brand-ink/60">
              €
            </span>
          </span>
        </label>
      ))}
      <button
        type="submit"
        disabled={busy}
        className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-default disabled:opacity-60 ${
          saved ? "bg-emerald-600" : "bg-brand-rose hover:bg-brand"
        }`}
      >
        {saved ? <CircleCheck className="size-4.5" aria-hidden /> : <Save className="size-4.5" aria-hidden />}
        <span role="status">{busy ? "Запазване…" : saved ? "Запазено" : "Запази"}</span>
      </button>
      {error && (
        <p role="alert" className="basis-full text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}

// The towns the filters and the forms offer: one can be added, renamed, moved up or down, or
// taken out of the list.
export function CityManager({ cities }: { cities: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  // The town being renamed, with what has been typed for it so far.
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  // The town whose removal is being asked about.
  const [confirming, setConfirming] = useState<string>();
  // What went wrong with a change to one of the towns in the list.
  const [rowError, setRowError] = useState<{ id: string; message: string }>();

  // Runs one change and answers whether it went through; `onFail` gets what to tell the user.
  const run = async (problem: Promise<string | undefined>, onFail: (message: string) => void) => {
    setBusy(true);
    const message = await problem;
    setBusy(false);
    if (message) {
      onFail(message);
      return false;
    }
    router.refresh();
    return true;
  };
  const failRow = (id: string) => (message: string) => setRowError({ id, message });
  const address = (id: string) => `/api/admin/cities/${id}`;

  const add = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(undefined);
    if (await run(request("/api/admin/cities", "POST", { name }), setError)) setName("");
  };

  const rename = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !editing) return;
    setRowError(undefined);
    if (await run(request(address(editing.id), "PATCH", { name: editing.name }), failRow(editing.id))) {
      setEditing(undefined);
    }
  };

  const move = (id: string, direction: "up" | "down") => {
    if (busy) return;
    setRowError(undefined);
    run(request(address(id), "PATCH", { move: direction }), failRow(id));
  };

  const remove = async (id: string) => {
    if (busy) return;
    setRowError(undefined);
    if (await run(request(address(id), "DELETE"), failRow(id))) setConfirming(undefined);
  };

  return (
    <>
      <form onSubmit={add} className="mt-4 flex flex-wrap items-start gap-3">
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          aria-label="Име на града"
          maxLength={40}
          placeholder="напр. Велико Търново"
          aria-invalid={Boolean(error)}
          className={`${field} flex-1 basis-56`}
        />
        <button
          type="submit"
          disabled={busy || name.trim().length < 2}
          className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-rose px-5 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-50 disabled:hover:bg-brand-rose"
        >
          <Plus className="size-4.5" aria-hidden />
          Добави
        </button>
        {error && (
          <p role="alert" className="basis-full text-xs text-red-600">
            {error}
          </p>
        )}
      </form>

      <ul className="mt-3 divide-y divide-black/5">
        {cities.map((city, index) => {
          const problem = rowError?.id === city.id ? rowError.message : undefined;

          if (editing?.id === city.id) {
            return (
              <li key={city.id} className="py-2.5">
                <form onSubmit={rename} aria-label={`Преименуване на „${city.name}“`} className="flex flex-wrap items-start gap-2">
                  <input
                    value={editing.name}
                    onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                    aria-label="Име на града"
                    maxLength={40}
                    autoFocus
                    aria-invalid={Boolean(problem)}
                    className={`${field} h-10 flex-1 basis-56`}
                  />
                  <button
                    type="submit"
                    disabled={busy || editing.name.trim().length < 2}
                    className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-rose px-4 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-50"
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
                    className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-semibold text-brand-ink transition-colors hover:border-brand-rose/50"
                  >
                    <X className="size-4.5" aria-hidden />
                    Отказ
                  </button>
                  {problem && (
                    <p role="alert" className="basis-full text-xs text-red-600">
                      {problem}
                    </p>
                  )}
                </form>
              </li>
            );
          }

          return (
            <li key={city.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <MapPin className="size-4.5 shrink-0 text-brand-rose" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-ink">{city.name}</p>
                {problem && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {problem}
                  </p>
                )}
              </div>

              {confirming === city.id ? (
                <span className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(city.id)}
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
                    aria-label={`Премести „${city.name}“ нагоре`}
                    title="Нагоре"
                    disabled={busy || index === 0}
                    onClick={() => move(city.id, "up")}
                    className={quiet}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Премести „${city.name}“ надолу`}
                    title="Надолу"
                    disabled={busy || index === cities.length - 1}
                    onClick={() => move(city.id, "down")}
                    className={quiet}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Преименувай „${city.name}“`}
                    title="Преименувай"
                    disabled={busy}
                    onClick={() => {
                      setEditing({ id: city.id, name: city.name });
                      setConfirming(undefined);
                      setRowError(undefined);
                    }}
                    className={quiet}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Изтрий града „${city.name}“`}
                    title="Изтрий"
                    disabled={busy}
                    onClick={() => {
                      setConfirming(city.id);
                      setRowError(undefined);
                    }}
                    className={`${smallButton} border-red-600/40 text-red-600 hover:bg-red-600/10`}
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
