"use client";

import { useRef, type ReactNode } from "react";
import { ChevronRight, Menu, X } from "lucide-react";

type SidebarDrawerProps = {
  // What the menu is, e.g. "Профил"; shown as the drawer's heading.
  label: string;
  // The section that is open now, shown on the button.
  current: string;
  // The menu itself, the same one the sidebar shows on wide screens.
  children: ReactNode;
};

// On phones and tablets, where there is no room for a sidebar next to the page: a bar above the
// page that names the open section, and slides the whole menu in from the left when pressed.
export default function SidebarDrawer({ label, current, children }: SidebarDrawerProps) {
  const drawerRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => drawerRef.current?.showModal()}
        className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 text-sm font-semibold text-brand-ink transition-colors hover:text-brand-rose"
      >
        <Menu className="size-5 shrink-0 text-brand-rose" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{current}</span>
        <span className="shrink-0 text-xs font-medium text-brand-ink/50">Меню</span>
        <ChevronRight className="size-4 shrink-0 text-brand-ink/50" aria-hidden />
      </button>

      <dialog
        ref={drawerRef}
        aria-label={label}
        // Only the dimmed area around the panel is the dialog itself; a click there closes it.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] overflow-y-auto overscroll-contain bg-white p-0 shadow-xl transition-transform duration-300 ease-out backdrop:bg-brand-ink/40 open:translate-x-0 motion-reduce:transition-none starting:open:-translate-x-full"
      >
        <div
          // Choosing a section, or signing out, puts the drawer away.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a, button")) drawerRef.current?.close();
          }}
          className="min-h-full p-3"
        >
          <div className="mb-2 flex items-center justify-between gap-3 pl-3">
            <h2 className="text-base font-bold text-brand-ink">{label}</h2>
            <button
              type="button"
              aria-label="Затвори менюто"
              className="flex size-10 cursor-pointer items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand-rose/10 hover:text-brand-rose"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </div>
  );
}
