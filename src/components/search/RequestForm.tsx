"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type ReactNode, type SubmitEvent } from "react";
import { CircleCheck, Gift, ImagePlus, LayoutGrid, MapPin, Phone, Sparkles, Tag, X, type LucideIcon } from "lucide-react";
import Combobox from "@/components/Combobox";
import MultiSelect from "@/components/MultiSelect";
import DescriptionField from "@/components/sell/DescriptionField";
import { uploadPhoto } from "@/components/sell/toJpeg";
import { useCategories, useCities } from "@/components/SiteOptionsProvider";
import { listingImageUrl } from "@/lib/listings/images";

const conditions = [
  { value: "any", label: "Без значение" },
  { value: "new", label: "Ново" },
  { value: "used", label: "Използвано" },
];

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 1000;
const BUDGET_MAX = 100000;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// In the order they appear on the page, so the first invalid one can be focused.
const fields = ["description", "title", "budget", "brand", "categories", "condition", "phone", "city"] as const;
type Field = (typeof fields)[number];
type Errors = Partial<Record<Field, string>>;

// The picture in the form: one just picked from the device (`file`), or the one the post being
// edited already has in the bucket (`stored`, its file name there).
type Photo = { url: string; file?: File; stored?: string };

// The post the form starts filled in with, when it edits one instead of making a new one.
export type EditedRequest = {
  id: string;
  title: string;
  description: string;
  categories: string[];
  brand: string;
  condition: string;
  budget: number | null;
  city: string;
  phone: string;
  // The picture's file name in the bucket, if the post has one.
  image: string | null;
};

// The same looks as the fields of the listing form (src/components/sell/ListingForm.tsx), which
// this form is laid out like.
const textInput =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const specInput =
  "h-9 w-44 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const chip =
  "flex h-9 cursor-pointer items-center rounded-lg border border-black/10 px-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10 has-checked:text-brand-rose has-focus-visible:ring-2 has-focus-visible:ring-brand-rose/40";

function validate(data: FormData) {
  const text = (name: Field) => String(data.get(name) ?? "").trim();
  const errors: Errors = {};
  const budget = text("budget").replace(",", ".");

  // The editor submits the formatted description and, next to it, its plain text for this check.
  if (String(data.get("description_text") ?? "").trim().length < DESCRIPTION_MIN) {
    errors.description = `Опиши какво търсиш с поне ${DESCRIPTION_MIN} знака.`;
  }
  if (text("title").length < 3) errors.title = "Напиши какво търсиш с поне 3 знака.";
  // The budget may be left empty, and is not asked for at all from somebody looking for something free.
  if (data.get("free") !== "on" && budget && !(Number(budget) > 0 && Number(budget) <= BUDGET_MAX)) {
    errors.budget = "Въведи сума, по-голяма от 0.";
  }
  if (data.getAll("categories").length === 0) errors.categories = "Избери поне една категория.";
  if (!PHONE_PATTERN.test(text("phone"))) errors.phone = "Въведи валиден телефонен номер.";
  if (!text("city")) errors.city = "Въведи град.";
  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

type SpecRowProps = {
  icon: LucideIcon;
  label: string;
  error?: string;
  children: ReactNode;
};

// One line of the details: the name on the left, the field to fill in on the right.
function SpecRow({ icon: Icon, label, error, children }: SpecRowProps) {
  return (
    <div className="border-b border-black/5 py-3 text-sm last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="flex items-center gap-2.5 text-brand-ink/60">
          <Icon className="size-4 text-brand-rose" aria-hidden />
          {label}
        </span>
        {children}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// The form for a "Търся" post: what the user is looking for, so that sellers can get in touch.
// Laid out like the form for a listing: the picture and the description on the left, the rest in
// the card on the right. With `request` it edits that post instead of making a new one.
type RequestFormProps = {
  request?: EditedRequest;
  // The phone number from the user's profile, which a new post starts with; it can be replaced
  // with another one.
  phone?: string;
  // Where to go once the post is saved; the user's own posts unless said otherwise.
  returnTo?: string;
};

export default function RequestForm({ request, phone, returnTo = "/profile/search" }: RequestFormProps) {
  const router = useRouter();
  const categories = useCategories();
  const cities = useCities();
  const [errors, setErrors] = useState<Errors>({});
  // "sending" while the post is on its way, "done" once it is saved.
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState<string>();
  const [photo, setPhoto] = useState<Photo | null>(() =>
    request?.image ? { stored: request.image, url: listingImageUrl(request.image) } : null,
  );
  const [photoError, setPhotoError] = useState<string>();
  // Looking to get the product for free: the budget is 0 and its field is switched off.
  const [free, setFree] = useState(request?.budget === 0);

  // The preview address holds the file in memory until it is released.
  const previewUrl = useRef<string>(undefined);
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  const choosePhoto = (file: File | undefined) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = undefined;
    setPhotoError(undefined);
    if (!file) return setPhoto(null);
    if (!PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_MB * 1024 * 1024) {
      return setPhotoError(`Снимката трябва да е JPG, PNG или WebP до ${MAX_PHOTO_MB} MB.`);
    }
    previewUrl.current = URL.createObjectURL(file);
    setPhoto({ file, url: previewUrl.current });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    choosePhoto(event.dataTransfer.files[0]);
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    setFormError(undefined);

    const focusFirst = (invalid: Errors) => {
      const first = fields.find((field) => invalid[field]);
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return Boolean(first);
    };
    if (focusFirst(found)) return;

    setStatus("sending");
    try {
      // A new picture is uploaded first; one the post already has stays where it is.
      let image = photo?.stored ?? "";
      if (photo?.file) {
        const uploaded = await uploadPhoto(photo.file);
        if ("message" in uploaded) {
          setFormError(uploaded.message);
          return setStatus("idle");
        }
        image = uploaded.file;
      }

      const response = await fetch(request ? `/api/requests/${request.id}` : "/api/requests", {
        method: request ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(fields.map((field) => [field, data.get(field)])),
          categories: data.getAll("categories"),
          free: data.get("free") === "on",
          image,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus("done");
        // Leaves the confirmation on the button for a moment, then shows the user's posts.
        setTimeout(() => {
          router.push(returnTo);
          router.refresh();
        }, 1500);
        return;
      }
      if (result.errors) {
        setErrors(result.errors);
        focusFirst(result.errors);
      }
      setFormError(result.message ?? "Не успяхме да публикуваме. Опитай отново.");
    } catch {
      setFormError("Не успяхме да публикуваме. Провери връзката си и опитай отново.");
    }
    setStatus("idle");
  };

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onChange={(event) => {
        const { name } = event.target as unknown as HTMLInputElement;
        if (errors[name as Field]) setErrors({ ...errors, [name]: undefined });
        setFormError(undefined);
      }}
      className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]"
    >
      <div className="space-y-6">
        <div>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="relative aspect-16/9 overflow-hidden rounded-xl bg-brand-pale"
          >
            {photo ? (
              <>
                {/* The whole picture is shown, whatever its shape; a blurred copy fills the space around it. */}
                <Image
                  src={photo.url}
                  alt=""
                  aria-hidden
                  fill
                  unoptimized
                  sizes="100px"
                  className="scale-110 object-cover opacity-60 blur-2xl"
                />
                <Image
                  src={photo.url}
                  alt="Снимка на продукта"
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain"
                />
                <button
                  type="button"
                  aria-label="Премахни снимката"
                  onClick={() => choosePhoto(undefined)}
                  className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </>
            ) : (
              <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center text-sm font-medium text-brand-ink/70 transition-colors hover:text-brand-rose has-focus-visible:text-brand-rose">
                <ImagePlus className="size-10" aria-hidden />
                Избери снимка на продукта или я пусни тук
                <span className="text-xs font-normal text-brand-ink/60">
                  По желание – една снимка, JPG, PNG или WebP, до {MAX_PHOTO_MB} MB
                </span>
                <input
                  type="file"
                  accept={PHOTO_TYPES.join(",")}
                  onChange={(event) => {
                    choosePhoto(event.target.files?.[0]);
                    // Lets the same file be picked again after it was removed.
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          <FieldError message={photoError} />
        </div>

        <section className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">Описание</h2>
          <DescriptionField
            id="request-description"
            name="description"
            defaultValue={request?.description}
            maxLength={DESCRIPTION_MAX}
            placeholder="Нюанс, количество, срок на годност, до кога ти трябва..."
            invalid={Boolean(errors.description)}
          />
          <FieldError message={errors.description} />
        </section>
      </div>

      <aside>
        <section className="rounded-2xl border border-black/5 bg-white">
          <div className="p-5">
            <input
              name="title"
              defaultValue={request?.title}
              aria-label="Какво търсиш"
              maxLength={120}
              placeholder="Какво търсиш?"
              aria-invalid={Boolean(errors.title)}
              className={`${textInput} h-11 text-lg font-bold`}
            />
            <FieldError message={errors.title} />

            {/* One bordered box holding the amount and the currency, as for a listing's price. */}
            <div className="mt-4 flex items-center gap-3">
              <label
                className={`flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-black/10 transition-colors focus-within:border-brand-rose has-aria-invalid:border-red-500 ${
                  free ? "bg-zinc-100" : "cursor-text bg-white"
                }`}
              >
                <input
                  // A text field, because a number field refuses the decimal comma in some browsers.
                  type="text"
                  name="budget"
                  defaultValue={request?.budget ? String(request.budget).replace(".", ",") : undefined}
                  // Switched off while the product is wanted for free, and so left out of what is sent.
                  disabled={free}
                  aria-label="Бюджет в евро"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={free ? "Безплатно" : "Бюджет"}
                  onInput={(event) => {
                    // Only digits, one decimal comma and two digits after it are kept.
                    const [whole, ...rest] = event.currentTarget.value.replace(/[^\d.,]/g, "").split(/[.,]/);
                    event.currentTarget.value = rest.length > 0 ? `${whole},${rest.join("").slice(0, 2)}` : whole;
                  }}
                  aria-invalid={Boolean(errors.budget)}
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-lg font-bold text-brand-ink outline-none placeholder:text-brand-ink/30"
                />
                <span
                  aria-hidden
                  className="flex h-full items-center border-l border-black/10 bg-brand-rose/10 px-3.5 text-base font-bold text-brand-rose"
                >
                  €
                </span>
              </label>
              {/* Looking to get it for nothing: no budget is asked for, and the post says "Безплатно". */}
              <label className={`${chip} h-11 shrink-0 gap-2 rounded-xl px-4`}>
                <input
                  type="checkbox"
                  name="free"
                  checked={free}
                  onChange={(event) => {
                    setFree(event.target.checked);
                    setErrors({ ...errors, budget: undefined });
                  }}
                  className="sr-only"
                />
                <Gift className="size-4" aria-hidden />
                Безплатно
              </label>
            </div>
            {errors.budget ? (
              <FieldError message={errors.budget} />
            ) : (
              <p className="mt-1 text-xs text-brand-ink/60">
                {free ? "Търсиш го без да плащаш." : "Най-много колко би платил – по желание."}
              </p>
            )}
          </div>

          <div className="border-t border-black/5 px-5">
            <SpecRow icon={Tag} label="Марка">
              <input
                name="brand"
                defaultValue={request?.brand}
                aria-label="Марка"
                maxLength={60}
                placeholder="по желание"
                className={specInput}
              />
            </SpecRow>
            {/* What is wanted may belong to more than one category. */}
            <SpecRow icon={LayoutGrid} label="Категория" error={errors.categories}>
              <MultiSelect
                name="categories"
                defaultValue={request?.categories}
                label="Категория"
                options={categories}
                invalid={Boolean(errors.categories)}
                className="h-9 w-44"
              />
            </SpecRow>
            <SpecRow icon={Sparkles} label="Състояние" error={errors.condition}>
              <div role="radiogroup" aria-label="Състояние" className="flex flex-wrap justify-end gap-2">
                {conditions.map(({ value, label }) => (
                  <label key={value} className={chip}>
                    <input
                      type="radio"
                      name="condition"
                      value={value}
                      defaultChecked={value === (request?.condition ?? "any")}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </SpecRow>
          </div>

          <div className="border-t border-black/5 p-5">
            <div className="relative">
              <Phone
                className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-brand-rose"
                aria-hidden
              />
              <input
                type="tel"
                name="phone"
                defaultValue={request ? request.phone : phone}
                aria-label="Телефон за връзка"
                autoComplete="tel"
                maxLength={20}
                placeholder="Телефон за връзка"
                aria-invalid={Boolean(errors.phone)}
                className={`${textInput} h-12 pl-11 text-sm font-semibold`}
              />
            </div>
            {errors.phone ? (
              <FieldError message={errors.phone} />
            ) : (
              <p className="mt-1 text-xs text-brand-ink/60">Показва се само на влезли в профила си потребители.</p>
            )}

            <div className="relative mt-3">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand-ink"
                aria-hidden
              />
              <Combobox
                name="city"
                defaultValue={request?.city}
                label="Град"
                options={cities}
                maxLength={50}
                placeholder="Град"
                invalid={Boolean(errors.city)}
                className="h-14 w-full rounded-xl border border-transparent bg-zinc-100 pr-4 pl-11 text-sm font-medium text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500"
              />
            </div>
            <FieldError message={errors.city} />

            <FieldError message={formError} />

            {/* Turns green with a confirmation once the post is saved; the user's posts open right after. */}
            <button
              type="submit"
              disabled={status !== "idle"}
              className={`mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:cursor-default ${
                status === "done" ? "bg-emerald-600" : "bg-brand-rose hover:bg-brand disabled:hover:bg-brand-rose"
              }`}
            >
              {status === "done" && <CircleCheck className="size-4.5" aria-hidden />}
              <span role="status">
                {status === "done"
                  ? request
                    ? "Промените са запазени"
                    : "Публикацията е качена успешно"
                  : status === "sending"
                    ? request
                      ? "Запазване…"
                      : "Публикуване…"
                    : request
                      ? "Запази промените"
                      : "Публикувай"}
              </span>
            </button>
          </div>
        </section>
      </aside>
    </form>
  );
}
