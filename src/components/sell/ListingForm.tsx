"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent, type ReactNode, type SubmitEvent } from "react";
import {
  CircleCheck,
  ImagePlus,
  LayoutGrid,
  MapPin,
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
import { categories, cities } from "@/data/listingOptions";

const conditions = [
  { value: "new", label: "Ново" },
  { value: "used", label: "Използвано" },
];

const deliveries = [
  { value: "pickup", label: "Лично предаване" },
  { value: "courier", label: "Спиди / Еконт" },
];

const MAX_PHOTOS = 8;
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRICE_MAX = 100000;
const DESCRIPTION_MIN = 20;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;

// In the order they appear on the page, so the first invalid one can be focused.
const fields = ["description", "title", "price", "brand", "category", "condition", "delivery", "phone", "city"] as const;
type Field = (typeof fields)[number];
type Errors = Partial<Record<Field, string>>;

type Photo = { file: File; url: string };

const roundButton =
  "absolute flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose";

const textInput =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const specInput =
  "h-9 w-44 rounded-lg border border-black/10 bg-white px-3 text-right text-sm font-semibold text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500";

const chip =
  "flex h-9 cursor-pointer items-center rounded-lg border border-black/10 px-3 text-sm font-medium text-brand-ink transition-colors hover:border-brand-rose/50 has-checked:border-brand-rose has-checked:bg-brand-rose/10 has-checked:text-brand-rose has-focus-visible:ring-2 has-focus-visible:ring-brand-rose/40";

const noSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function validate(data: FormData) {
  const text = (name: Field) => String(data.get(name) ?? "").trim();
  const price = Number(text("price"));
  const errors: Errors = {};

  if (text("description").length < DESCRIPTION_MIN) {
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
  options: { value: string; label: string }[];
};

function Chips({ label, name, type, options }: ChipsProps) {
  return (
    <div role={type === "radio" ? "radiogroup" : "group"} aria-label={label} className="flex flex-wrap justify-end gap-2">
      {options.map((option) => (
        <label key={option.value} className={chip}>
          <input type={type} name={name} value={option.value} className="sr-only" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export default function ListingForm() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState(0);
  const [photoError, setPhotoError] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  const [ready, setReady] = useState(false);

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

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(new FormData(form));
    setErrors(found);

    const firstInvalid = fields.find((field) => found[field]);
    if (firstInvalid) {
      setReady(false);
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    // TODO: upload `photos` and save the listing once the listings backend exists.
    setReady(true);
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
        setReady(false);
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
                  <Image
                    src={current.url}
                    alt={current.file.name}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
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
            <label htmlFor="listing-description">Описание</label>
          </h2>
          <textarea
            id="listing-description"
            name="description"
            rows={8}
            maxLength={2000}
            placeholder="Състояние, нюанс, срок на годност, колко е използван продуктът..."
            aria-invalid={Boolean(errors.description)}
            className={`${textInput} mt-3 resize-y py-2.5 text-sm leading-6`}
          />
          <FieldError message={errors.description} />
        </section>
      </div>

      <aside>
        <section className="rounded-2xl border border-black/5 bg-white">
          <div className="p-5">
            <input
              name="title"
              aria-label="Заглавие"
              maxLength={80}
              placeholder="Заглавие на обявата"
              aria-invalid={Boolean(errors.title)}
              className={`${textInput} h-11 text-lg font-bold`}
            />
            <FieldError message={errors.title} />

            <div className="relative mt-4">
              <input
                type="number"
                name="price"
                aria-label="Цена в евро"
                min={0}
                max={PRICE_MAX}
                step="0.01"
                inputMode="decimal"
                placeholder="0,00"
                aria-invalid={Boolean(errors.price)}
                className={`${textInput} ${noSpinner} h-12 pr-10 text-2xl font-bold`}
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-2xl font-bold text-brand-ink/60">
                €
              </span>
            </div>
            <FieldError message={errors.price} />
          </div>

          <div className="border-t border-black/5 px-5">
            <SpecRow icon={Tag} label="Марка" error={errors.brand}>
              <input
                name="brand"
                aria-label="Марка"
                maxLength={50}
                placeholder="напр. Dior"
                aria-invalid={Boolean(errors.brand)}
                className={specInput}
              />
            </SpecRow>
            <SpecRow icon={LayoutGrid} label="Категория" error={errors.category}>
              <select
                name="category"
                aria-label="Категория"
                defaultValue=""
                aria-invalid={Boolean(errors.category)}
                className={`${specInput} cursor-pointer`}
              >
                <option value="" disabled>
                  Избери
                </option>
                {categories.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </SpecRow>
            <SpecRow icon={Sparkles} label="Състояние" error={errors.condition}>
              <Chips label="Състояние" name="condition" type="radio" options={conditions} />
            </SpecRow>
            <SpecRow icon={Palette} label="Цвят">
              <input name="color" aria-label="Цвят" maxLength={40} placeholder="по желание" className={specInput} />
            </SpecRow>
            <SpecRow icon={Truck} label="Изпращане" error={errors.delivery}>
              <Chips label="Изпращане" name="delivery" type="checkbox" options={deliveries} />
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
              <input
                name="city"
                aria-label="Град"
                list="listing-cities"
                maxLength={50}
                placeholder="Град"
                aria-invalid={Boolean(errors.city)}
                className="h-14 w-full rounded-xl border border-transparent bg-zinc-100 pr-4 pl-11 text-sm font-medium text-brand-ink transition-colors outline-none placeholder:font-normal placeholder:text-brand-ink/40 focus:border-brand-rose aria-invalid:border-red-500"
              />
              <datalist id="listing-cities">
                {cities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <FieldError message={errors.city} />

            {ready && (
              <p role="status" className="mt-3 flex gap-3 rounded-xl bg-brand-rose/10 p-4 text-sm leading-5 text-brand-ink/80">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-rose" aria-hidden />
                Обявата е попълнена правилно. Публикуването ще заработи, щом добавим запазването на обявите.
              </p>
            )}

            <button
              type="submit"
              className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-brand-rose text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              Публикувай обявата
            </button>
          </div>
        </section>
      </aside>
    </form>
  );
}
