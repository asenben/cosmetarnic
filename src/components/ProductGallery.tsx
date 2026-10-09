"use client";

import { MotionConfig, motion } from "motion/react";
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

  // Set by a swipe, so the tap that ends it is not also taken as a click on a picture.
  const swiped = useRef(false);
  const onSwipe = (distance: number) => {
    if (Math.abs(distance) < 50) return;
    swiped.current = true;
    setTimeout(() => (swiped.current = false), 100);
    step(distance < 0 ? 1 : -1);
  };

  return (
    <div>
      {/* With several pictures there is no frame: they stand freely on the page. A single picture,
          or none, keeps the tinted frame it fills. */}
      <div
        className={`relative aspect-4/3 w-full sm:aspect-16/9 ${
          images.length > 1 ? "overflow-x-clip" : "overflow-hidden rounded-xl bg-brand-pale"
        }`}
      >
        {images.length > 1 ? (
          // A "coverflow": the chosen picture faces the viewer in the middle, and the ones before
          // and after it stand turned in 3D at its sides. Choosing another makes them swing round.
          <MotionConfig reducedMotion="user">
            <motion.div
              onPanEnd={(_, info) => onSwipe(info.offset.x)}
              className="absolute inset-0 touch-pan-y perspective-distant"
            >
              {images.map((src, index) => {
                // How many places from the middle, the short way round, so the row has no end.
                let offset = index - selected;
                if (offset > images.length / 2) offset -= images.length;
                if (offset < -images.length / 2) offset += images.length;
                const distance = Math.abs(offset);
                const side = Math.sign(offset);

                return (
                  <motion.button
                    key={src}
                    type="button"
                    aria-label={
                      offset === 0 ? "Виж на цял екран" : `Изображение ${index + 1} от ${images.length}`
                    }
                    aria-current={offset === 0}
                    tabIndex={distance > 1 ? -1 : 0}
                    onClick={() => {
                      if (swiped.current) return;
                      if (offset === 0) lightboxRef.current?.showModal();
                      else setSelected(index);
                    }}
                    initial={false}
                    animate={{
                      // Percentages of the picture's own width; -50% centres it.
                      x: `${-50 + offset * 52}%`,
                      rotateY: side * -52,
                      scale: offset === 0 ? 1 : 0.7,
                      // Only the neighbours show; with no frame to clip them, the rest would reach outside.
                      opacity: distance > 1 ? 0 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 240, damping: 30 }}
                    style={{ zIndex: 10 - distance, pointerEvents: distance > 1 ? "none" : "auto" }}
                    className="absolute inset-y-0 left-1/2 aspect-square cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg shadow-brand-ink/20"
                  >
                    {/* The whole photo is shown, whatever its shape; a blurred copy fills the space around it. */}
                    <Image
                      src={src}
                      alt=""
                      aria-hidden
                      fill
                      sizes="100px"
                      className="scale-110 object-cover opacity-60 blur-2xl"
                    />
                    <Image
                      src={src}
                      alt={offset === 0 ? alt : ""}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 1024px) 35vw, 60vw"
                      className="object-contain"
                    />
                  </motion.button>
                );
              })}
            </motion.div>
          </MotionConfig>
        ) : images.length === 1 ? (
          <>
            {/* The whole photo is shown, whatever its shape; a blurred copy fills the space around it. */}
            <Image
              src={images[0]}
              alt=""
              aria-hidden
              fill
              sizes="100px"
              className="scale-110 object-cover opacity-60 blur-2xl"
            />
            <Image
              src={images[0]}
              alt={alt}
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-contain"
            />
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 text-sm font-medium text-brand-ink/60">
            <Image src="/images/logo.svg" alt="" width={96} height={96} className="size-24 rounded-full opacity-80" />
            Няма изображение
          </div>
        )}

        {badge && (
          <span className="absolute top-4 left-4 z-20 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-rose shadow-sm">
            {badge}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Предишно изображение"
              onClick={() => step(-1)}
              className={`${roundButton} top-1/2 left-4 z-20 -translate-y-1/2`}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Следващо изображение"
              onClick={() => step(1)}
              className={`${roundButton} top-1/2 right-4 z-20 -translate-y-1/2`}
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
            className={`${roundButton} right-4 bottom-4 z-20`}
          >
            <Maximize2 className="size-4.5" aria-hidden />
          </button>
        )}
      </div>

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
