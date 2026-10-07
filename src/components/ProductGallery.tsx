"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
  badge?: string;
};

const roundButton =
  "absolute flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose";

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  // Width divided by height of each image that has loaded in the lightbox.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const ratio = ratios[images[selected]];

  const step = (offset: number) => setSelected((selected + offset + images.length) % images.length);

  return (
    <div className="flex gap-3">
      <div className="relative aspect-16/9 min-w-0 flex-1 overflow-hidden rounded-xl bg-brand-pale">
        {images.length > 0 ? (
          <Image
            src={images[selected]}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 text-sm font-medium text-brand-ink/60">
            <Image src="/images/logo.svg" alt="" width={96} height={96} className="size-24 rounded-full opacity-80" />
            Няма изображение
          </div>
        )}

        {badge && (
          <span className="absolute top-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-rose shadow-sm">
            {badge}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Предишно изображение"
              onClick={() => step(-1)}
              className={`${roundButton} top-1/2 left-4 -translate-y-1/2`}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Следващо изображение"
              onClick={() => step(1)}
              className={`${roundButton} top-1/2 right-4 -translate-y-1/2`}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}

        {images.length > 0 && (
          <button
            type="button"
            aria-label="Виж на цял екран"
            onClick={() => lightboxRef.current?.showModal()}
            className={`${roundButton} right-4 bottom-4`}
          >
            <Maximize2 className="size-4.5" aria-hidden />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <ul className="order-first flex shrink-0 flex-col gap-2">
          {images.map((src, index) => (
            <li key={src} className="w-14">
              <button
                type="button"
                aria-label={`Изображение ${index + 1} от ${images.length}`}
                aria-current={index === selected}
                onClick={() => setSelected(index)}
                className={`relative block aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-brand-pale ring-2 transition ${
                  index === selected ? "ring-brand-rose" : "ring-transparent hover:ring-brand-rose/40"
                }`}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <dialog
          ref={lightboxRef}
          aria-label="Изображение на цял екран"
          // A click on the image or the dimmed area around it closes the lightbox.
          onClick={() => lightboxRef.current?.close()}
          className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-brand-ink/80 p-4 backdrop:bg-transparent sm:p-10"
        >
          <div className="flex size-full items-center justify-center [container-type:size]">
            {/* Once the image's proportions are known the frame shrinks to fit it, so the rounded
                corners follow the picture instead of the whole screen. */}
            <div
              className="relative overflow-hidden rounded-2xl"
              style={
                ratio
                  ? { aspectRatio: ratio, width: `min(100cqw, 100cqh * ${ratio})` }
                  : { width: "100%", height: "100%" }
              }
            >
              <Image
                src={images[selected]}
                alt={alt}
                fill
                sizes="100vw"
                className="object-contain"
                onLoad={({ currentTarget: { naturalWidth, naturalHeight } }) => {
                  const src = images[selected];
                  if (naturalHeight > 0) setRatios((known) => ({ ...known, [src]: naturalWidth / naturalHeight }));
                }}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label="Затвори"
            className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink transition-colors hover:text-brand-rose"
          >
            <X className="size-5" aria-hidden />
          </button>
        </dialog>
      )}
    </div>
  );
}
