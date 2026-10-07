"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ComponentProps, type ReactNode, type SubmitEvent } from "react";
import {
  AtSign,
  ChartNoAxesColumn,
  CircleCheck,
  FileText,
  Link2,
  Mail,
  MapPin,
  Phone,
  Save,
  Share2,
  User,
  type LucideIcon,
} from "lucide-react";
import Select from "@/components/Select";
import { useAuth } from "@/components/auth/AuthProvider";
import AvatarUpload from "@/components/profile/AvatarUpload";
import LinkMark from "@/components/profile/LinkMark";
import SecuritySettings, { type SessionRow } from "@/components/profile/SecuritySettings";
import { cities } from "@/data/listingOptions";
import type { ProfileDetails, ProfileErrors, ProfileField } from "@/lib/auth/profile";
import { profileLinks } from "@/lib/auth/profileLinks";

// Kept in step with BIO_MAX in src/lib/auth/profile.ts, which the server enforces.
const BIO_MAX = 500;
const GENERIC_ERROR = "Нещо се обърка. Опитай отново след малко.";

const tabs = [
  { id: "profile", label: "Профил" },
  { id: "security", label: "Сигурност" },
  { id: "notifications", label: "Известия" },
  { id: "privacy", label: "Поверителност" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const cityOptions = cities.map((city) => ({ value: city, label: city }));

const control =
  "w-full rounded-xl border border-black/10 bg-white text-sm text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500 disabled:bg-zinc-50 disabled:text-brand-ink/60";

// A switch, drawn after a visually hidden checkbox marked `peer`: a track with a knob that slides
// across when the checkbox is on.
const switchTrack =
  "relative h-5 w-9 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-brand-rose peer-focus-visible:ring-2 peer-focus-visible:ring-brand-rose/40 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4";

const section = "rounded-2xl border border-black/5 p-4 sm:p-5";
const sectionIcon = "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose/10 text-brand-rose";

const linkSections = [
  {
    group: "social",
    icon: Share2,
    title: "Социални профили",
    hint: "Добави връзки към твоите социални профили. Те могат да бъдат показани публично.",
  },
  {
    group: "marketplace",
    icon: Link2,
    title: "Профили в други платформи",
    hint: "Добави връзки към твоите профили в други търговски платформи.",
  },
] as const;

type CardProps = { icon: LucideIcon; title: string; hint: string; children: ReactNode };

function Card({ icon: Icon, title, hint, children }: CardProps) {
  return (
    <section className={section}>
      <div className="flex items-center gap-3">
        <span className={sectionIcon}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-brand-ink">{title}</h2>
          <p className="text-xs text-brand-ink/60">{hint}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type FieldProps = ComponentProps<"input"> & { label: string; icon: LucideIcon; error?: string; note?: string };

function Field({ label, icon: Icon, error, note, ...input }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-brand-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute inset-y-px left-px flex w-10 items-center justify-center rounded-l-xl border-r border-black/10 bg-zinc-50 text-brand-ink/70">
          <Icon className="size-4" aria-hidden />
        </span>
        <input id={id} aria-invalid={Boolean(error)} {...input} className={`${control} h-11 pr-3.5 pl-13`} />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {note && !error && <p className="mt-1 text-xs text-brand-ink/50">{note}</p>}
    </div>
  );
}

type SettingsFormProps = { profile: ProfileDetails; sessions: SessionRow[] };

export default function SettingsForm({ profile, sessions }: SettingsFormProps) {
  const router = useRouter();
  const { updateUser } = useAuth();
  const bioId = useId();
  const [tab, setTab] = useState<TabId>("profile");
  const [bioLength, setBioLength] = useState(profile.bio.length);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  // Which links are switched to "public". A link with no address has nothing to show, so its
  // switch is off and locked until an address is typed, and turns on by itself at that moment.
  const [linkFilled, setLinkFilled] = useState(() =>
    Object.fromEntries(profileLinks.map(({ key }) => [key, profile.links[key].url !== ""])),
  );
  const [linkPublic, setLinkPublic] = useState(() =>
    Object.fromEntries(profileLinks.map(({ key }) => [key, profile.links[key].url !== "" && profile.links[key].public])),
  );

  // Typing in a field clears its error and the "saved" note from the last save.
  const touched = (field: ProfileField) => () => {
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
    setSaved(false);
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setPending(true);
    setFormError(undefined);
    setSaved(false);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.get("full_name"),
          username: data.get("username"),
          phone: data.get("phone"),
          city: data.get("city"),
          bio: data.get("bio"),
          show_stats: data.get("show_stats") === "on",
          links: Object.fromEntries(
            profileLinks.map(({ key }) => [
              key,
              { url: data.get(`link_${key}`), public: data.get(`public_${key}`) === "on" },
            ]),
          ),
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setErrors({});
        setSaved(true);
        // The username is shown in the navigation and on other pages.
        updateUser({ username: result.profile.username });
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
    <div className="mt-5">
      <div role="tablist" aria-label="Настройки" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-black/10">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? "border-brand-rose text-brand-rose" : "border-transparent text-brand-ink hover:text-brand-rose"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <section className={`${section} flex items-center gap-3`}>
            <span className={`${sectionIcon} hidden self-start sm:flex`}>
              <User className="size-5" aria-hidden />
            </span>
            <AvatarUpload />
          </section>

          <Card icon={User} title="Лични данни" hint="Тази информация ще бъде видима в профила ти.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Име и фамилия"
                icon={User}
                name="full_name"
                autoComplete="name"
                maxLength={80}
                required
                defaultValue={profile.full_name}
                error={errors.full_name}
                onChange={touched("full_name")}
              />
              <Field
                label="Потребителско име"
                icon={AtSign}
                name="username"
                autoComplete="username"
                minLength={3}
                maxLength={30}
                required
                defaultValue={profile.username}
                error={errors.username}
                onChange={touched("username")}
              />
              <Field
                label="Имейл адрес"
                icon={Mail}
                type="email"
                value={profile.email}
                disabled
                readOnly
                note="Имейлът засега не може да се сменя оттук."
              />
              <Field
                label="Телефонен номер"
                icon={Phone}
                type="tel"
                name="phone"
                autoComplete="tel"
                required
                defaultValue={profile.phone}
                placeholder="+359 88 123 4567"
                error={errors.phone}
                onChange={touched("phone")}
              />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
                  <MapPin className="size-4 text-brand-ink/70" aria-hidden />
                  Град
                </p>
                <div className="mt-1.5">
                  <Select
                    name="city"
                    label="Град"
                    options={cityOptions}
                    defaultValue={profile.city}
                    onChange={touched("city")}
                    invalid={Boolean(errors.city)}
                    className="h-11 w-full"
                  />
                </div>
                {errors.city && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.city}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {linkSections.map(({ group, icon, title, hint }) => (
            <Card key={group} icon={icon} title={title} hint={hint}>
              <ul className="space-y-3">
                {profileLinks
                  .filter((link) => link.group === group)
                  .map(({ key, label, example }) => (
                    <li key={key}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="flex w-32 shrink-0 items-center gap-3 text-sm font-semibold text-brand-ink">
                          <LinkMark site={key} />
                          {label}
                        </span>
                        <input
                          // Plain text rather than type="url": addresses are accepted without "https://".
                          type="text"
                          inputMode="url"
                          name={`link_${key}`}
                          aria-label={`Адрес на профила в ${label}`}
                          maxLength={200}
                          defaultValue={profile.links[key].url}
                          placeholder={example}
                          autoComplete="off"
                          aria-invalid={Boolean(errors[key])}
                          onChange={(event) => {
                            touched(key)();
                            const filled = event.target.value.trim() !== "";
                            if (filled !== linkFilled[key]) {
                              setLinkFilled({ ...linkFilled, [key]: filled });
                              setLinkPublic({ ...linkPublic, [key]: filled });
                            }
                          }}
                          className={`${control} h-10 min-w-0 flex-1 basis-56 px-3.5`}
                        />
                        <label
                          title={linkFilled[key] ? undefined : "Първо въведи адрес"}
                          className="flex cursor-pointer items-center gap-2 text-sm text-brand-ink/80 has-disabled:cursor-not-allowed has-disabled:opacity-50"
                        >
                          <input
                            type="checkbox"
                            name={`public_${key}`}
                            checked={linkPublic[key]}
                            disabled={!linkFilled[key]}
                            onChange={(event) => {
                              setLinkPublic({ ...linkPublic, [key]: event.target.checked });
                              setSaved(false);
                            }}
                            className="peer sr-only"
                          />
                          <span aria-hidden className={switchTrack} />
                          Публичен
                        </label>
                      </div>
                      {errors[key] && (
                        <p role="alert" className="mt-1 text-xs text-red-600 sm:pl-35">
                          {errors[key]}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            </Card>
          ))}

          <Card
            icon={ChartNoAxesColumn}
            title="Статистика в профила"
            hint="Броят на активните ти обяви, продажбите и любимите, показан над „За мен“ в „Моят профил“."
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm text-brand-ink">
              <input
                type="checkbox"
                name="show_stats"
                defaultChecked={profile.show_stats}
                onChange={() => setSaved(false)}
                className="peer sr-only"
              />
              <span aria-hidden className={switchTrack} />
              Показвай статистиката в профила
            </label>
          </Card>

          <Card
            icon={FileText}
            title="За мен"
            hint="Разкажи малко повече за себе си. Това ще помогне на другите потребители да те опознаят."
          >
            <label htmlFor={bioId} className="sr-only">
              За мен
            </label>
            <textarea
              id={bioId}
              name="bio"
              rows={4}
              maxLength={BIO_MAX}
              defaultValue={profile.bio}
              aria-invalid={Boolean(errors.bio)}
              onChange={(event) => {
                setBioLength(event.target.value.length);
                touched("bio")();
              }}
              className={`${control} scrollbar-soft resize-y px-3.5 py-2.5 leading-6`}
            />
            <div className="mt-1 flex justify-between gap-3 text-xs">
              <p role="alert" className="text-red-600">
                {errors.bio}
              </p>
              <p className="shrink-0 text-brand-ink/50 tabular-nums">
                {bioLength}/{BIO_MAX}
              </p>
            </div>
          </Card>

          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            {/* After a save the button itself turns green and says so, until something is edited again. */}
            <button
              type="submit"
              disabled={pending}
              className={`flex h-11 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70 ${
                saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-rose hover:bg-brand"
              }`}
            >
              {saved ? <CircleCheck className="size-4.5" aria-hidden /> : <Save className="size-4.5" aria-hidden />}
              <span role="status">
                {pending ? "Запазване…" : saved ? "Промените са запазени" : "Запази промените"}
              </span>
            </button>
          </div>
        </form>
      ) : tab === "security" ? (
        <SecuritySettings sessions={sessions} />
      ) : (
        <p role="tabpanel" className="py-12 text-center text-sm text-brand-ink/60">
          Този раздел още не е готов.
        </p>
      )}
    </div>
  );
}
