"use client";

import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import gsap from "gsap";
import { X } from "lucide-react";

export type AuthModalHandle = {
  // Slides the panel out, applies the content change while it is off screen, then slides it back in.
  swap: (change: () => void) => void;
};

type AuthModalProps = {
  ref?: Ref<AuthModalHandle>;
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
};

export default function AuthModal({ ref, open, onClose, children }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const backdrop = backdropRef.current;
    const scroller = scrollerRef.current;
    const panel = panelRef.current;
    if (!dialog || !backdrop || !scroller || !panel) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Far enough to start (and end) fully below the viewport.
    const offscreen = window.innerHeight;
    gsap.killTweensOf([backdrop, panel]);
    // While the panel travels it sits outside its scroll container, which would show a scrollbar.
    scroller.style.overflowY = "hidden";

    if (open) {
      if (!dialog.open) {
        // showModal() focuses the close button and scrolls it into view. If the panel is still parked
        // below the screen from the last close, that scroll leaves it stuck in view until the tween
        // catches up, so open with the panel at rest and undo any scroll before sliding it in.
        gsap.set(panel, { y: 0 });
        dialog.showModal();
        scroller.scrollTop = 0;
      }
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: reducedMotion ? 0 : 0.4, ease: "power2.out" });
      gsap.fromTo(
        panel,
        { y: reducedMotion ? 0 : offscreen },
        {
          y: 0,
          duration: reducedMotion ? 0 : 1,
          ease: "power2.out",
          onComplete: () => {
            scroller.style.overflowY = "";
          },
        },
      );
    } else if (dialog.open) {
      gsap.to(backdrop, { opacity: 0, duration: reducedMotion ? 0 : 0.3, ease: "power2.in" });
      gsap.to(panel, {
        y: reducedMotion ? 0 : offscreen,
        duration: reducedMotion ? 0 : 0.4,
        ease: "power3.in",
        onComplete: () => dialog.close(),
      });
    }
  }, [open]);

  useImperativeHandle(ref, () => ({
    swap(change) {
      const scroller = scrollerRef.current;
      const panel = panelRef.current;
      if (!scroller || !panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        change();
        return;
      }

      gsap.killTweensOf(panel);
      scroller.style.overflowY = "hidden";
      gsap.to(panel, {
        y: window.innerHeight,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => {
          change();
          scroller.scrollTop = 0;
          gsap.to(panel, {
            y: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
              scroller.style.overflowY = "";
            },
          });
        },
      });
    },
  }));

  // The page keeps its scrollbar while the modal is open, so stop wheel and touch scrolling from reaching it.
  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    if (!dialog || !scroller) return;

    const blockPageScroll = (event: Event) => {
      if (scroller.scrollHeight <= scroller.clientHeight) event.preventDefault();
    };
    dialog.addEventListener("wheel", blockPageScroll, { passive: false });
    dialog.addEventListener("touchmove", blockPageScroll, { passive: false });
    return () => {
      dialog.removeEventListener("wheel", blockPageScroll);
      dialog.removeEventListener("touchmove", blockPageScroll);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Вход и регистрация"
      // Escape should play the closing animation instead of closing instantly.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent backdrop:bg-transparent"
    >
      <div ref={backdropRef} onClick={onClose} className="absolute inset-0 bg-brand-ink/30 backdrop-blur-md" />

      <div
        ref={scrollerRef}
        className="pointer-events-none relative flex size-full overflow-y-auto overscroll-contain p-4"
      >
        <div
          ref={panelRef}
          className="pointer-events-auto relative m-auto w-full will-change-transform max-w-md rounded-3xl bg-white p-5 shadow-2xl shadow-brand-ink/20"
        >
          <button
            type="button"
            aria-label="Затвори"
            onClick={onClose}
            className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-rose/10 hover:text-brand-rose"
          >
            <X className="size-5" aria-hidden />
          </button>

          {children}
        </div>
      </div>
    </dialog>
  );
}