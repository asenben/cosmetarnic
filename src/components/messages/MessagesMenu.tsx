"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { MessageSquare, ShieldCheck } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";

// A conversation as GET /api/conversations answers with it.
type MenuConversation = {
  id: string;
  username: string;
  avatar: string | null;
  // Whether the other person is an administrator of the site.
  admin: boolean;
  subject: string;
  lastBody: string | null;
  lastMine: boolean;
  ago: string;
  unread: number;
};

type Inbox = { unread: number; conversations: MenuConversation[] };

// The messages button in the navigation. It shows how many messages wait unopened, and opens a
// list of the latest conversations: those with the site's administrators first, then those with
// people writing about the user's listings and posts. `ring` is the colour around the number,
// the one of whatever the button sits on.
export default function MessagesMenu({ className = "", ring = "ring-white" }: { className?: string; ring?: string }) {
  const id = useId();
  const pathname = usePathname();
  const { isLoggedIn, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) throw new Error();
      setInbox((await response.json()) as Inbox);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  };

  // The number on the button is brought up to date on every page, e.g. after a conversation is read.
  useEffect(() => {
    if (!isLoggedIn) return;
    let current = true;
    fetch("/api/conversations")
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded: Inbox | null) => {
        if (current && loaded) setInbox(loaded);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [isLoggedIn, pathname]);

  const unread = isLoggedIn ? (inbox?.unread ?? 0) : 0;
  const conversations = inbox?.conversations ?? [];
  const groups = [
    { title: "От администратора", list: conversations.filter(({ admin }) => admin) },
    { title: "От потребители", list: conversations.filter(({ admin }) => !admin) },
  ].filter(({ list }) => list.length > 0);

  return (
    <div
      className={`relative ${className}`}
      // Closes when focus leaves the menu: a click elsewhere, or tabbing past the last item.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={unread > 0 ? `Съобщения (${unread} непрочетени)` : "Съобщения"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          // Signed-out visitors get the login form instead.
          if (!requireAuth()) return;
          if (!open) load();
          setOpen(!open);
        }}
        className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-ink transition-colors hover:bg-brand/10 hover:text-brand"
      >
        <MessageSquare className="size-5.5" aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className={`absolute top-0 right-0 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-rose px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ${ring}`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Under the button on wide screens; across the screen under the navigation on phones. */}
      <div
        id={id}
        role="menu"
        aria-label="Съобщения"
        className={`z-50 origin-top-right rounded-2xl border border-black/5 bg-white p-2 shadow-lg shadow-brand-ink/10 transition duration-150 ease-out motion-reduce:transition-none max-md:fixed max-md:inset-x-4 max-md:top-16 md:absolute md:top-full md:right-0 md:mt-3 md:w-88 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <p className="px-3 pt-1.5 pb-1 text-sm font-bold text-brand-ink">Съобщения</p>

        <div className="max-h-96 scrollbar-soft overflow-y-auto overscroll-contain">
          {groups.map(({ title, list }) => (
            <section key={title}>
              <h3 className="px-3 pt-2.5 pb-1 text-[0.6875rem] font-bold tracking-wider text-brand-ink/50 uppercase">
                {title}
              </h3>
              <ul>
                {list.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`/profile/messages/${conversation.id}`}
                      // Opening a conversation marks its messages as read, so it is not loaded ahead of the click.
                      prefetch={false}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50"
                    >
                      {conversation.admin ? (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-rose text-white">
                          <ShieldCheck className="size-5" aria-hidden />
                        </span>
                      ) : (
                        <Avatar name={conversation.username} src={conversation.avatar} className="size-10 text-sm" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={`min-w-0 truncate text-sm text-brand-ink ${
                              conversation.unread > 0 ? "font-bold" : "font-semibold"
                            }`}
                          >
                            {conversation.admin ? "Администратор" : conversation.username}
                          </span>
                          <span className="shrink-0 text-[0.6875rem] text-brand-ink/50">{conversation.ago}</span>
                        </span>
                        <span className="block truncate text-xs font-medium text-brand-rose">{conversation.subject}</span>
                        <span
                          className={`block truncate text-xs ${
                            conversation.unread > 0 ? "font-semibold text-brand-ink" : "text-brand-ink/60"
                          }`}
                        >
                          {conversation.lastMine && "Ти: "}
                          {conversation.lastBody}
                        </span>
                      </span>
                      {conversation.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-rose px-1.5 text-[0.6875rem] font-bold text-white">
                          {conversation.unread}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {groups.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-brand-ink/60">
              {failed ? "Съобщенията не можаха да се заредят." : inbox ? "Все още нямаш съобщения." : "Зареждане…"}
            </p>
          )}
        </div>

        <Link
          href="/profile/messages"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="mt-1 flex h-10 items-center justify-center rounded-xl border-t border-black/5 text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/10"
        >
          Виж всички съобщения
        </Link>
      </div>
    </div>
  );
}
