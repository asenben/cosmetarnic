"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type SubmitEvent,
} from "react";
import { Check, Send } from "lucide-react";

// A message as the page shows it. `sentAt` is the time as text the server can also produce, so
// both render the same. `readAt`, in the same form, is when the other person saw it, if they have.
export type ThreadMessage = {
  id: string;
  body: string;
  mine: boolean;
  sentAt: string;
  readAt: string | null;
};

// How often the open conversation asks for new messages.
const REFRESH_MS = 5000;
const MESSAGE_MAX = 2000;

// Times and days are always as they are in Bulgaria, whatever the reader's device is set to. Each
// message shows its time; the day stands once above the messages written on it.
const timeFormat = new Intl.DateTimeFormat("bg-BG", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});
const dayFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Sofia",
});

// The time now, for "Видяно преди 5m" to count up while the conversation is open. It moves
// on every few seconds and is the same between moves, so the page is drawn again only when it
// changes. On the server there is none, so the count is first drawn on the visitor's device.
const CLOCK_STEP_MS = 10_000;
const clockNow = () => Math.floor(Date.now() / CLOCK_STEP_MS) * CLOCK_STEP_MS;
const subscribeToClock = (onChange: () => void) => {
  const timer = setInterval(onChange, CLOCK_STEP_MS);
  return () => clearInterval(timer);
};

// "Видяно" in the first minute, then how long ago, short as in Instagram: whole minutes ("5m"),
// whole hours from the first hour ("3h"), and whole days from the first day ("1d").
function seenAgo(readAt: string, now: number) {
  const minutes = Math.floor((now - new Date(readAt).getTime()) / 60_000);
  if (minutes < 1) return "Видяно";
  if (minutes < 60) return `Видяно преди ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Видяно преди ${hours}h`;
  return `Видяно преди ${Math.floor(hours / 24)}d`;
}

type ThreadProps = { conversationId: string; initialMessages: ThreadMessage[] };

// The messages of one conversation with the box for writing a new one. New messages from the
// other person appear on their own every few seconds, and so do the ticks on the user's own: one
// grey tick once a message is sent, two pink ones once the other person has seen it.
export default function Thread({ conversationId, initialMessages }: ThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const listRef = useRef<HTMLOListElement>(null);
  const now = useSyncExternalStore(subscribeToClock, clockNow, () => null);
  // As in Instagram, how long ago it was seen is written under the user's last message only.
  const lastMine = messages.findLast(({ mine }) => mine);

  useEffect(() => {
    let stopped = false;
    const timer = setInterval(async () => {
      // Nothing is asked while the tab is in the background.
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (response.ok && !stopped) setMessages((await response.json()).messages);
      } catch {
        // The next round tries again.
      }
    }, REFRESH_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [conversationId]);

  // Keeps the newest message in view when one arrives or is sent.
  const total = messages.length;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [total]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessages(result.messages);
        setText("");
      } else {
        setError(result.message);
      }
    } catch {
      setError("Не успяхме да изпратим съобщението. Провери връзката си и опитай отново.");
    }
    setSending(false);
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  // Enter sends; Shift+Enter starts a new line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <>
      <ol
        ref={listRef}
        aria-label="Съобщения"
        // As tall as the screen allows, so the box for writing stays in view under it; it scrolls
        // up and down only, never sideways.
        className="scrollbar-soft mt-4 flex h-[calc(100dvh-25rem)] max-h-[32rem] min-h-64 flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl bg-zinc-50 p-3 sm:p-4"
      >
        {messages.length === 0 && (
          <li className="m-auto text-center text-sm text-brand-ink/60">
            Все още няма съобщения. Напиши първото отдолу.
          </li>
        )}
        {messages.map(({ id, body, mine, sentAt, readAt }, index) => {
          // A new day starts with its date in the middle, above its first message.
          const day = dayFormat.format(new Date(sentAt));
          const newDay = index === 0 || day !== dayFormat.format(new Date(messages[index - 1].sentAt));
          return (
            <Fragment key={id}>
              {newDay && (
                <li className="my-1 self-center rounded-full bg-white px-3 py-1 text-[0.6875rem] font-medium text-brand-ink/60 shadow-sm first:mt-0">
                  {day}
                </li>
              )}
              <li
                className={`flex max-w-[85%] min-w-0 flex-col sm:max-w-[75%] ${mine ? "items-end self-end" : "items-start self-start"}`}
              >
                {/* A long word or an address with no spaces is broken wherever it has to be, so the
                bubble never grows wider than the conversation. */}
                <p
                  className={`max-w-full rounded-2xl px-3.5 py-2 text-sm leading-5 wrap-anywhere whitespace-pre-line ${
                    mine
                      ? "rounded-br-md bg-brand-rose text-white"
                      : "rounded-bl-md border border-black/5 bg-white text-brand-ink"
                  }`}
                >
                  <span className="sr-only">{mine ? "Ти: " : "Събеседникът: "}</span>
                  {body}
                </p>
                <span className="mt-1 flex items-center gap-1 px-1 text-[0.6875rem] text-brand-ink/50">
                  <time dateTime={sentAt}>{timeFormat.format(new Date(sentAt))}</time>
                  {mine &&
                    (readAt ? (
                      // Two ticks of the same size as the single one, a little apart.
                      <span title="Видяно" className="flex text-brand-rose">
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        <Check className="-ml-1.5 size-4" strokeWidth={2.5} aria-hidden />
                        <span className="sr-only">Видяно</span>
                      </span>
                    ) : (
                      <span title="Изпратено" className="flex">
                        <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        <span className="sr-only">Изпратено</span>
                      </span>
                    ))}
                </span>
                {id === lastMine?.id && readAt && now !== null && (
                  <span className="px-1 text-[0.6875rem] font-medium text-brand-rose">{seenAgo(readAt, now)}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>

      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(undefined);
          }}
          onKeyDown={onKeyDown}
          aria-label="Ново съобщение"
          rows={1}
          maxLength={MESSAGE_MAX}
          placeholder="Напиши съобщение..."
          className="scrollbar-soft h-10 min-w-0 flex-1 resize-none rounded-xl border border-black/10 bg-white px-3.5 py-[9px] text-sm leading-5 text-brand-ink transition-colors outline-none placeholder:text-brand-ink/40 focus:border-brand-rose"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Изпрати"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-rose text-sm sm:w-auto sm:px-5 font-semibold text-white transition-colors hover:bg-brand disabled:cursor-default disabled:opacity-50 disabled:hover:bg-brand-rose"
        >
          {/* The paper plane's shape leans to the top right, so it is nudged to look centred. */}
          <Send className="size-4.5 -translate-x-px translate-y-px sm:size-4" aria-hidden />
          {/* On phones the paper plane alone, to leave the room to the text. */}
          <span className="hidden sm:inline">Изпрати</span>
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
