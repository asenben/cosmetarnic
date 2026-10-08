"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type ReactNode, type SubmitEvent } from "react";
import {
  CircleCheck,
  ImagePlus,
  LayoutGrid,
  MapPin,
  Package,
  Palette,
  Phone,
  Plus,
  Sparkles,
  Star,
  Tag,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import Combobox from "@/components/Combobox";
import Select from "@/components/Select";
import DescriptionField from "@/components/sell/DescriptionField";
import { uploadPhoto } from "@/components/sell/toJpeg";
import { categories, cities } from "@/data/listingOptions";
import { MAX_LISTING_PHOTOS, listingImageUrl } from "@/lib/listings/images";

const conditions = [
  { value: "new", label: "Ново" },
  { value: "used", label: "Използвано" },
];

const deliveries = [
  { value: "pickup", label: "Лично предаване", icon: MapPin },
  { value: "speedy", label: "Спиди", icon: Truck },
  { value: "econt", label: "Еконт", icon: Truck },
];

const MAX_PHOTOS = MAX_LISTING_PHOTOS;
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRICE_MAX = 100000;
const DESCRIPTION_MIN = 20;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;

// In the order they appear on the page, so the first invalid one can be focused.
const fields = ["description", "title", "price", "brand", "category", "condition", "delivery", "phone", "city"] as const;
type Field = (typeof fields)[number];
type Errors = Partial<Record<Field, string>>;

// A photo in the form: one just picked from the device (`file`), or one the listing being edited
// already has in the bucket (`stored`, its file name there).
type Photo = { url: string; file?: File; stored?: string };

// The listing the form starts filled in with, when it edits one instead of making a new one.
export type EditedListing = {
  id: string;
  title: string;
  price: number;
  brand: string;
  category: string;
  condition: string;
  color: string;
  delivery: string[];
  phone: string;
  city: string;
  // The description as the HTML the editor produced.
  description: string;
  // The photos' file names in the bucket, cover first.
  images: string[];
};

// Sends the listing with its photos and answers with the listing's id, or with what went wrong.
// With `editedId` the changes are saved to that listing instead of publishing a new one.
async function publish(data: FormData, photos: Photo[], editedId?: string) {
  const images: string[] = [];
  for (const { file, stored } of photos) {
    // Photos the listing already has stay where they are; only new ones are uploaded.
    if (!file) {
      if (stored) images.push(stored);
      continue;
    }
    const uploaded = await uploadPhoto(file);
    if ("message" in uploaded) return { message: uploaded.message };
    images.push(uploaded.file);
  }

  const response = await fetch(editedId ? `/api/listings/${editedId}` : "/api/listings", {
    method: editedId ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...Object.fromEntries(fields.map((field) => [field, data.get(field)])),
      color: data.get("color"),
      delivery: data.getAll("delivery"),
      images,
    }),
  });
  const result = await response.json();
  if (!response.ok) return { message: result.message as string, errors: result.errors as Errors | undefined };
  return { id: result.id as string };
}

const roundButton =
  "absolute flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose";

const textInput =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const specInput =
  "h-9 w-44 rounded-lg border border-black/10 bg-white px-3 text-sm font-semibold text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const chip =
  "flex h-9 cursor-pointer items-center rounded-lg border border-black/10 px-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10 has-checked:text-brand-rose has-focus-visible:ring-2 has-focus-visible:ring-brand-rose/40";

function validate(data: FormData) {
  const text = (name: Field) => String(data.get(name) ?? "").trim();
  // The amount may be typed with a decimal comma or a point.
  const price = Number(text("price").replace(",", "."));
  const errors: Errors = {};

  // The editor submits the formatted description and, next to it, its plain text for this check.
  if (String(data.get("description_text") ?? "").trim().length < DESCRIPTION_MIN) {
    errors.description = `Опиши продукта с поне ${DESCRIPTION_MIN} знака.`;
  }
  if (text("title").length < 3) errors.title = "Заглавието трябва да е поне 3 знака.";
  if (!(price > 0 && price <= PRICE_MAX)) errors.price = "Въведи цена, по-голяма от 0.";
  if (text("brand").length < 2) errors.brand = "Въведи марката на продукта.";
  if (!text("category")) errors.category = "Избери категория.";
  if (!text("condition")) errors.condition = "Избери състояние.";
  if (data.getAll("delivery").length === 0) errors.delivery = "Избери поне един начин на доставка.";
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

// One line of the product's details: the name on the left, the field to fill in on the right.
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

type ChipsProps = {
  label: string;
  name: string;
  type: "radio" | "checkbox";
  options: { value: string; label: string; icon?: LucideIcon }[];
  // The values that start chosen.
  chosen?: string[];
};

function Chips({ label, name, type, options, chosen = [] }: ChipsProps) {
  return (
    <div role={type === "radio" ? "radiogroup" : "group"} aria-label={label} className="flex flex-wrap justify-end gap-2">
      {options.map(({ value, label: text, icon: Icon }) => (
        <label key={value} className={`${chip} gap-1.5`}>
          <input type={type} name={name} value={value} defaultChecked={chosen.includes(value)} className="sr-only" />
          {Icon && <Icon className="size-4" aria-hidden />}
          {text}
        </label>
      ))}
    </div>
  );
}

// The form for a new listing; with `listing` it edits that listing instead.
export default function ListingForm({ listing }: { listing?: EditedListing }) {
  const [photos, setPhotos] = useState<Photo[]>(
    () => listing?.images.map((stored) => ({ stored, url: listingImageUrl(stored) })) ?? [],
  );
  const [selected, setSelected] = useState(0);
  const [photoError, setPhotoError] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  // "sending" while the photos and the listing are on their way, "done" once it is saved.
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState<string>();
  const router = useRouter();

  // The preview addresses hold the files in memory until they are released.
  const previewUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addPhotos = (files: File[]) => {
    const accepted = files.filter(
      (file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_MB * 1024 * 1024,
    );
    const room = MAX_PHOTOS - photos.length;
    const added = accepted.slice(0, room).map((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.current.add(url);
      return { file, url };
    });

    setPhotos([...photos, ...added]);
    if (added.length > 0) setSelected(photos.length);
    if (accepted.length < files.length) {
      setPhotoError(`Снимките трябва да са JPG, PNG или WebP до ${MAX_PHOTO_MB} MB.`);
    } else if (accepted.length > room) {
      setPhotoError(`Можеш да добавиш до ${MAX_PHOTOS} снимки.`);
    } else {
      setPhotoError(undefined);
    }
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
    setPhotos(photos.filter((photo) => photo.url !== url));
    setSelected(0);
    setPhotoError(undefined);
  };

  // The first photo is the one shown on the listing's card.
  const makeCover = (url: string) => {
    setPhotos([...photos.filter((photo) => photo.url === url), ...photos.filter((photo) => photo.url !== url)]);
    setSelected(0);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    addPhotos([...event.dataTransfer.files]);
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
      const result = await publish(data, photos, listing?.id);
      if (result.id) {
        setStatus("done");
        // Leaves the confirmation on the button for a moment, then opens the listing.
        setTimeout(() => {
          router.push(`/product/${result.id}`);
          // The pages already visited showed the listing as it was before.
          router.refresh();
        }, 1500);
        return;
      }
      if (result.errors) {
        setErrors(result.errors);
        focusFirst(result.errors);
      }
      setFormError(result.message ?? "Не успяхме да качим обявата. Опитай отново.");
    } catch {
      setFormError("Не успяхме да качим обявата. Провери връзката си и опитай отново.");
    }
    setStatus("idle");
  };

  const fileInput = (
    <input
      type="file"
      accept={PHOTO_TYPES.join(",")}
      multiple
      onChange={(event) => {
        addPhotos([...(event.target.files ?? [])]);
        // Lets the same file be picked again after it was removed.
        event.target.value = "";
      }}
      className="sr-only"
    />
  );

  const current = photos[selected];

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
          <div className="flex gap-3">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              className="relative aspect-16/9 min-w-0 flex-1 overflow-hidden rounded-xl bg-brand-pale"
            >
              {current ? (
                <>
                  {/* The whole photo is shown, whatever its shape; a blurred copy fills the space around it. */}
                  <Image
                    src={current.url}
                    alt=""
                    aria-hidden
                    fill
                    unoptimized
                    sizes="100px"
                    className="scale-110 object-cover opacity-60 blur-2xl"
                  />
                  <Image
                    src={current.url}
                    alt={current.file?.name ?? "Снимка на продукта"}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain"
                  />
                  {selected === 0 ? (
                    <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-rose shadow-sm">
                      Корица
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(current.url)}
                      className="absolute top-4 left-4 flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-ink shadow-sm transition-colors hover:text-brand-rose"
                    >
                      <Star className="size-3.5" aria-hidden />
                      Направи корица
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Премахни снимката"
                    onClick={() => removePhoto(current.url)}
                    className={`${roundButton} top-4 right-4`}
                  >
                    <X className="size-5" aria-hidden />
                  </button>
                </>
              ) : (
                <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center text-sm font-medium text-brand-ink/70 transition-colors hover:text-brand-rose has-focus-visible:text-brand-rose">
                  <ImagePlus className="size-10" aria-hidden />
                  Избери снимки или ги пусни тук
                  <span className="text-xs font-normal text-brand-ink/60">
                    До {MAX_PHOTOS} снимки, JPG, PNG или WebP, до {MAX_PHOTO_MB} MB всяка
                  </span>
                  {fileInput}
                </label>
              )}
            </div>

            {photos.length > 0 && (
              <ul className="order-first flex shrink-0 flex-col gap-2">
                {photos.map(({ url }, index) => (
                  <li key={url} className="w-14">
                    <button
                      type="button"
                      aria-label={`Снимка ${index + 1} от ${photos.length}`}
                      aria-current={index === selected}
                      onClick={() => setSelected(index)}
                      className={`relative block aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-brand-pale ring-2 transition ${
                        index === selected ? "ring-brand-rose" : "ring-transparent hover:ring-brand-rose/40"
                      }`}
                    >
                      <Image src={url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                    </button>
                  </li>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <li className="w-14">
                    <label
                      title="Добави снимки"
                      className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-brand-pastel text-brand-rose transition-colors hover:border-brand-rose hover:bg-brand-rose/10 has-focus-visible:border-brand-rose"
                    >
                      <Plus className="size-5" aria-hidden />
                      <span className="sr-only">Добави снимки</span>
                      {fileInput}
                    </label>
                  </li>
                )}
              </ul>
            )}
          </div>
          <FieldError message={photoError} />
        </div>

        <section className="rounded-2xl border border-black/5 bg-white p-5">
          <h2 className="text-sm font-bold tracking-wider text-brand-ink uppercase">
            Описание
          </h2>
          <DescriptionField
            id="listing-description"
            name="description"
            defaultValue={listing?.description}
            maxLength={2000}
            placeholder="Състояние, нюанс, срок на годност, колко е използван продуктът..."
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
              defaultValue={listing?.title}
              aria-label="Заглавие"
              maxLength={80}
              placeholder="Заглавие на обявата"
              aria-invalid={Boolean(errors.title)}
              className={`${textInput} h-11 text-lg font-bold`}
            />
            <FieldError message={errors.title} />

            {/* One bordered box holding the amount and the currency; the border lights up
                for the whole box when the amount inside is focused or invalid. */}
            <label className="mt-4 flex h-11 w-48 cursor-text items-center overflow-hidden rounded-xl border border-black/10 bg-white transition-colors focus-within:border-brand-rose has-aria-invalid:border-red-500">
              <input
                // A text field, because a number field refuses the decimal comma in some browsers.
                type="text"
                name="price"
                defaultValue={listing && String(listing.price).replace(".", ",")}
                aria-label="Цена в евро"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                onInput={(event) => {
                  // Only digits, one decimal comma and two digits after it are kept.
                  const [whole, ...rest] = event.currentTarget.value.replace(/[^\d.,]/g, "").split(/[.,]/);
                  event.currentTarget.value = rest.length > 0 ? `${whole},${rest.join("").slice(0, 2)}` : whole;
                }}
                aria-invalid={Boolean(errors.price)}
                className={`h-full min-w-0 flex-1 bg-transparent px-3.5 text-lg font-bold text-brand-ink outline-none placeholder:text-brand-ink/30`}
              />
              <span
                aria-hidden
                className="flex h-full items-center border-l border-black/10 bg-brand-rose/10 px-3.5 text-base font-bold text-brand-rose"
              >
                €
              </span>
            </label>
            <FieldError message={errors.price} />
          </div>

          <div className="border-t border-black/5 px-5">
            <SpecRow icon={Tag} label="Марка" error={errors.brand}>
              <input
                name="brand"
                defaultValue={listing?.brand}
                aria-label="Марка"
                maxLength={50}
                placeholder="напр. Dior"
                aria-invalid={Boolean(errors.brand)}
                className={specInput}
              />
            </SpecRow>
            <SpecRow icon={LayoutGrid} label="Категория" error={errors.category}>
              <Select
                name="category"
                defaultValue={listing?.category}
                label="Категория"
                options={categories}
                invalid={Boolean(errors.category)}
                className="h-9 w-44"
              />
            </SpecRow>
            <SpecRow icon={Sparkles} label="Състояние" error={errors.condition}>
              <Chips
                label="Състояние"
                name="condition"
                type="radio"
                options={conditions}
                chosen={listing && [listing.condition]}
              />
            </SpecRow>
            <SpecRow icon={Palette} label="Цвят">
              <input
                name="color"
                defaultValue={listing?.color}
                aria-label="Цвят"
                maxLength={40}
                placeholder="по желание"
                className={specInput}
              />
            </SpecRow>
            <SpecRow icon={Package} label="Изпращане" error={errors.delivery}>
              <Chips
                label="Изпращане"
                name="delivery"
                type="checkbox"
                options={deliveries}
                chosen={listing?.delivery}
              />
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
                defaultValue={listing?.phone}
                aria-label="Телефон"
                autoComplete="tel"
                maxLength={20}
                placeholder="Телефон за връзка"
                aria-invalid={Boolean(errors.phone)}
                className={`${textInput} h-12 pl-11 text-sm font-semibold`}
              />
            </div>
            <FieldError message={errors.phone} />

            <div className="relative mt-3">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand-ink"
                aria-hidden
              />
              <Combobox
                name="city"
                defaultValue={listing?.city}
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

            {/* Turns green with a confirmation once the listing is saved; the new listing opens right after. */}
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
                  ? listing
                    ? "Промените са запазени"
                    : "Обявата е качена успешно"
                  : status === "sending"
                    ? listing
                      ? "Запазване…"
                      : "Качване…"
                    : listing
                      ? "Запази промените"
                      : "Публикувай обявата"}
              </span>
            </button>
          </div>
        </section>
      </aside>
    </form>
  );
}
