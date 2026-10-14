"use client";

import { MotionConfig, motion } from "motion/react";
import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  alt: string;
  badge?: string;
};

const roundButton =
  "absolute flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-brand-ink shadow-sm transition-colors hover:text-brand-rose";

// The buttons under the pictures, apart from them on the page's own background, so they never
// melt into a photo.
const controlButton =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-brand-ink transition-colors hover:border-brand-rose hover:text-brand-rose";

export default function ProductGallery({ images, alt, badge }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  // Width divided by height of each image that has loaded in the lightbox.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const ratio = ratios[images[selected]];

  // The spot the lightbox's picture is enlarged around, in percent of its size; null while it is
  // shown whole. Turning to another picture or closing the lightbox shows it whole again.
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  // Whether the lightbox is open: only then are the pictures beside the shown one loaded ahead.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const openLightbox = () => {
    lightboxRef.current?.showModal();
    setLightboxOpen(true);
  };
  // Remembers a picture's proportions once it has loaded, so the lightbox's frame fits it at once.
  const rememberRatio = (src: string, { naturalWidth, naturalHeight }: HTMLImageElement) => {
    if (naturalHeight > 0) setRatios((known) => ({ ...known, [src]: naturalWidth / naturalHeight }));
  };
  const zoomAt = (event: MouseEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * 100, y: ((event.clientY - box.top) / box.height) * 100 };
  };

  const step = (offset: number) => {
    setZoom(null);
    setSelected((selected + offset + images.length) % images.length);
  };

  // Set by a swipe, so the tap that ends it is not also taken as a click on a picture.
  const swiped = useRef(false);
  // Where a one-finger touch on the lightbox's picture started, for telling a swipe.
  const touchStart = useRef<number | null>(null);
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
                      if (offset === 0) openLightbox();
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

        {/* A single picture keeps its button for the full screen on it; with several it is under them. */}
        {images.length === 1 && (
          <button
            type="button"
            aria-label="Виж на цял екран"
            onClick={openLightbox}
            className={`${roundButton} right-4 bottom-4 z-20`}
          >
            <Maximize2 className="size-4.5" aria-hidden />
          </button>
        )}
      </div>

      {/* With several pictures: a dot for each under them, the one shown drawn long, with the
          arrows to turn on either side and the full screen at the end. */}
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span aria-hidden />
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Предишно изображение" onClick={() => step(-1)} className={controlButton}>
              <ChevronLeft className="size-4.5" aria-hidden />
            </button>
            <ul className="flex items-center gap-1.5">
              {images.map((src, index) => (
                <li key={src} className="flex">
                  <button
                    type="button"
                    aria-label={`Изображение ${index + 1} от ${images.length}`}
                    aria-current={index === selected}
                    onClick={() => {
                      setZoom(null);
                      setSelected(index);
                    }}
                    // A larger area to tap than the dot itself.
                    className="group flex h-6 cursor-pointer items-center px-0.5"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                        index === selected ? "w-6 bg-brand-rose" : "w-2 bg-brand-ink/20 group-hover:bg-brand-ink/40"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" aria-label="Следващо изображение" onClick={() => step(1)} className={controlButton}>
              <ChevronRight className="size-4.5" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            aria-label="Виж на цял екран"
            onClick={openLightbox}
            className={`${controlButton} justify-self-end`}
          >
            <Maximize2 className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {images.length > 0 && (
        <dialog
          ref={lightboxRef}
          aria-label="Изображение на цял екран"
          // A click on the dimmed area around the picture closes the lightbox; one on the picture
          // enlarges it instead (see below).
          onClick={() => lightboxRef.current?.close()}
          onClose={() => {
            setZoom(null);
            setLightboxOpen(false);
          }}
          // The arrow keys turn to the picture before or after, as a swipe does on a touch screen.
          onKeyDown={(event) => {
            if (images.length < 2) return;
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
          }}
          className="fixed inset-0 m-0 size-full max-h-none max-w-none bg-brand-ink/80 p-4 backdrop:bg-transparent sm:p-10"
        >
          <div className="flex size-full flex-col gap-3 sm:gap-4">
            {/* On a touch screen a swipe turns to the picture before or after; not while two
                fingers enlarge it, nor while the page is zoomed in. */}
            <div
              onTouchStart={(event) => {
                touchStart.current = event.touches.length === 1 ? event.touches[0].clientX : null;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (start === null || images.length < 2 || (window.visualViewport?.scale ?? 1) > 1.01) return;
                const distance = event.changedTouches[0].clientX - start;
                if (Math.abs(distance) > 50) step(distance < 0 ? 1 : -1);
              }}
              className="flex min-h-0 flex-1 items-center justify-center [container-type:size]"
            >
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
                {/* A click enlarges the picture around the spot clicked, and the enlarged part then
                    follows the pointer; another click shows it whole again. */}
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    // Only with a mouse: on a touch screen the picture is enlarged with two fingers,
                    // and both at once would ask the phone for more memory than it has.
                    if (!window.matchMedia("(pointer: fine)").matches) return;
                    setZoom(zoom ? null : zoomAt(event));
                  }}
                  onMouseMove={(event) => {
                    if (zoom) setZoom(zoomAt(event));
                  }}
                  className={`absolute inset-0 ${zoom ? "pointer-fine:cursor-zoom-out" : "pointer-fine:cursor-zoom-in"}`}
                >
                  <Image
                    src={images[selected]}
                    alt={alt}
                    fill
                    sizes="100vw"
                    style={zoom ? { transform: "scale(2.5)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                    className="object-contain transition-transform duration-200 ease-out motion-reduce:transition-none"
                    onLoad={({ currentTarget }) => rememberRatio(images[selected], currentTarget)}
                  />
                </div>

                {/* The pictures before and after the shown one, loaded unseen in the same size while
                    the lightbox is open, so turning to them shows them at once instead of waiting. */}
                {lightboxOpen &&
                  [...new Set([-1, 1].map((offset) => images[(selected + offset + images.length) % images.length]))]
                    .filter((src) => src !== images[selected])
                    .map((src) => (
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        aria-hidden
                        fill
                        sizes="100vw"
                        loading="eager"
                        className="invisible"
                        onLoad={({ currentTarget }) => rememberRatio(src, currentTarget)}
                      />
                    ))}
              </div>
            </div>

            {/* Under the picture, apart from it: which one it is, and a small copy of every picture
                to turn straight to. Nothing is drawn over the picture itself. */}
            {images.length > 1 && (
              <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                <p aria-live="polite" className="text-center text-sm font-semibold text-white/80 tabular-nums">
                  {selected + 1} / {images.length}
                </p>
                <ul className="mx-auto mt-2 flex w-fit max-w-full gap-2 overflow-x-auto p-1 [scrollbar-width:none]">
                  {images.map((src, index) => (
                    <li key={src} className="shrink-0">
                      <button
                        type="button"
                        aria-label={`Изображение ${index + 1} от ${images.length}`}
                        aria-current={index === selected}
                        onClick={() => {
                          setZoom(null);
                          setSelected(index);
                        }}
                        className={`relative block size-12 cursor-pointer overflow-hidden rounded-lg bg-white/10 transition sm:size-14 ${
                          index === selected
                            ? "opacity-100 ring-2 ring-white"
                            : "opacity-50 ring-1 ring-white/20 hover:opacity-90"
                        }`}
                      >
                        <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
