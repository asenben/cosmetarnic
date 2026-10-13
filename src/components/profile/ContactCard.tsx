"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode, type SubmitEvent } from "react";
import { CircleCheck, MapPin, Phone, Save, Truck } from "lucide-react";
import Select from "@/components/Select";
import { useCities } from "@/components/SiteOptionsProvider";
import type { ProfileDetails, ProfileErrors } from "@/lib/auth/profile";
import { DELIVERY_OPTIONS } from "@/lib/listings/delivery";

const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

// The same looks as the fields and switches of the settings (src/components/profile/SettingsForm.tsx)
// and the chips of the listing form.
const control =
  "w-full rounded-xl border border-black/10 bg-white text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500 read-only:cursor-not-allowed read-only:bg-zinc-100 read-only:text-brand-ink/60";

const switchTrack =
  "relative h-5 w-9 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-brand-rose peer-focus-visible:ring-2 peer-focus-visible:ring-brand-rose/40 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4";

const chip =
  "flex h-9 cursor-pointer items-center rounded-lg border border-black/10 px-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10 has-checked:text-brand-rose has-focus-visible:ring-2 has-focus-visible:ring-brand-rose/40";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

type RowProps = {
  icon: typeof Phone;
  label: string;
  // The name of the "shown in the listings" switch, when the row has one.
  visibility?: { name: string; checked: boolean };
  children: ReactNode;
};

// One detail: its name, the switch for whether it is shown, and the field under them.
function Row({ icon: Icon, label, visibility, children }: RowProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
          <Icon className="size-4 text-brand-rose" aria-hidden />
          {label}
        </span>
        {visibility && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/80">
            <input
              type="checkbox"
              name={visibility.name}
              defaultChecked={visibility.checked}
              className="peer sr-only"
            />
            <span aria-hidden className={switchTrack} />
            Видим в обявите
          </label>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// The card on "Моят профил" that every listing and "Търся" post takes its details from: the phone
// and the town, each with whether it is shown, and the ways of handing over. They are not asked for
// in the listing form; a change here reaches all the user's listings at once.
export default function ContactCard({ profile }: { profile: ProfileDetails }) {
  const router = useRouter();
  // The town the profile already has stays on offer even if it has left the site's list since.
  const cityOptions = [...new Set([...useCities(), ...(profile.city ? [profile.city] : [])])].map((city) => ({
    value: city,
    label: city,
  }));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const touched = () => {
    setSaved(false);
    setFormError(undefined);
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setFormError(undefined);
    setSaved(false);
    try {
      const response = await fetch("/api/profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.get("phone"),
          show_phone: data.get("show_phone") === "on",
          city: data.get("city"),
          show_city: data.get("show_city") === "on",
          delivery: data.getAll("delivery"),
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setErrors({});
        setSaved(true);
        router.refresh();
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

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-bold text-brand-ink">Данни за обявите</h2>
      <p className="mt-1 text-sm text-brand-ink/60">
        Задават се веднъж и важат за всички твои обяви и публикации в „Търся“.
      </p>

      <form onSubmit={onSubmit} onChange={touched} className="mt-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Row
            icon={Phone}
            label="Телефон"
            visibility={{ name: "show_phone", checked: profile.show_phone }}
          >
            <input
              type="tel"
              name="phone"
              aria-label="Телефон"
              autoComplete="tel"
              defaultValue={profile.phone}
              // The number the account was registered with stays; only an administrator changes it.
              readOnly={Boolean(profile.phone)}
              placeholder="+359 88 123 4567"
              aria-invalid={Boolean(errors.phone)}
              className={`${control} h-11 px-3.5`}
            />
            <FieldError message={errors.phone} />
          </Row>

          <Row
            icon={MapPin}
            label="Град"
            visibility={{ name: "show_city", checked: profile.show_city }}
          >
            <Select
              name="city"
              label="Град"
              options={cityOptions}
              defaultValue={profile.city}
              onChange={touched}
              invalid={Boolean(errors.city)}
              className="h-11 w-full"
            />
            <FieldError message={errors.city} />
          </Row>
        </div>

        <Row icon={Truck} label="Изпращане">
          <div role="group" aria-label="Начини на изпращане" className="flex flex-wrap gap-2">
            {DELIVERY_OPTIONS.map(({ value, label }) => (
              <label key={value} className={chip}>
                <input
                  type="checkbox"
                  name="delivery"
                  value={value}
                  defaultChecked={profile.delivery.includes(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError message={errors.delivery} />
        </Row>

        {formError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div className="flex justify-end">
          {/* After a save the button turns green and says so, until something is changed again. */}
          <button
            type="submit"
            disabled={pending}
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70 ${
              saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-rose hover:bg-brand"
            }`}
          >
            {saved ? <CircleCheck className="size-4.5" aria-hidden /> : <Save className="size-4.5" aria-hidden />}
            <span role="status">{pending ? "Запазване…" : saved ? "Промените са запазени" : "Запази"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
