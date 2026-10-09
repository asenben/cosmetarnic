"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type SubmitEvent } from "react";
import { Send } from "lucide-react";

// A message as the page shows it. `sentAt` is the time as text the server can also produce, so
// both render the same.
export type ThreadMessage = { id: string; body: string; mine: boolean; sentAt: string };

// How often the open conversation asks for new messages.
const REFRESH_MS = 5000;
const MESSAGE_MAX = 2000;

// The time is always shown as it is in Bulgaria, whatever the reader's device is set to.
const timeFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

type ThreadProps = { conversationId: string; initialMessages: ThreadMessage[] };

// The messages of one conversation with the box for writing a new one. New messages from the
// other person appear on their own every few seconds.
export default function Thread({ conversationId, initialMessages }: ThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const listRef = useRef<HTMLOListElement>(null);

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
  const count = messages.length;
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [count]);

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
        {messages.map(({ id, body, mine, sentAt }) => (
          <li
            key={id}
            className={`flex max-w-[85%] min-w-0 flex-col sm:max-w-[75%] ${mine ? "items-end self-end" : "items-start self-start"}`}
          >
            {/* A long word or an address with no spaces is broken wherever it has to be, so the
                bubble never grows wider than the conversation. */}
            <p
              className={`max-w-full rounded-2xl px-3.5 py-2 text-sm leading-5 wrap-anywhere whitespace-pre-line ${
                mine ? "rounded-br-md bg-brand-rose text-white" : "rounded-bl-md border border-black/5 bg-white text-brand-ink"
              }`}
            >
              <span className="sr-only">{mine ? "Ти: " : "Събеседникът: "}</span>
              {body}
            </p>
            <time dateTime={sentAt} className="mt-1 px-1 text-[0.6875rem] text-brand-ink/50">
              {timeFormat.format(new Date(sentAt))}
            </time>
          </li>
        ))}
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
