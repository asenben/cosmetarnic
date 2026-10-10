import { sql } from "@/lib/db";

// Messages between two users. A conversation is always about one thing, a "Търся" post or a
// listing, and is between the person who wrote first (the starter) and the one who published it
// (the owner). The same two people writing about the same thing share one conversation.

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MESSAGE_MAX = 2000;

export type ConversationSummary = {
  id: string;
  // What the conversation is about: its title when the conversation started, and where it is.
  subject: string;
  kind: "request" | "listing";
  // The address of the post or listing, or null once it has been deleted.
  href: string | null;
  other: { username: string; avatar: string | null };
  // The latest message, if any has been sent yet.
  lastBody: string | null;
  lastAt: Date;
  // Whether the latest message is the user's own.
  lastMine: boolean;
  // How many messages from the other person the user has not opened yet.
  unread: number;
};

export type Message = {
  id: string;
  body: string;
  mine: boolean;
  sentAt: Date;
};

const toSummary = (row: Record<string, unknown>): ConversationSummary => {
  const kind = row.kind === "request" ? "request" : "listing";
  // Empty once the post or the listing has been deleted.
  const target = (kind === "request" ? row.request_id : row.listing_id) as string | null;
  return {
    id: row.id as string,
    subject: row.subject as string,
    kind,
    href: target ? `${kind === "request" ? "/search" : "/product"}/${target}` : null,
    other: { username: row.other_username as string, avatar: row.other_avatar as string | null },
    lastBody: (row.last_body as string | null) ?? null,
    lastAt: new Date(row.last_message_at as string),
    lastMine: row.last_sender_id === row.viewer_id,
    unread: (row.unread as number | null) ?? 0,
  };
};

type StartResult = { ok: true; id: string } | { ok: false; message: string };

// Opens the conversation between the user and whoever published the post or the listing, making
// it if the two have not written about it before. Nothing is sent yet.
export async function startConversation(
  userId: string,
  target: { requestId?: unknown; listingId?: unknown },
): Promise<StartResult> {
  const requestId = typeof target.requestId === "string" && ID_PATTERN.test(target.requestId) ? target.requestId : null;
  const listingId = typeof target.listingId === "string" && ID_PATTERN.test(target.listingId) ? target.listingId : null;
  if ((requestId === null) === (listingId === null)) return { ok: false, message: "Невалидна заявка." };

  const [topic] = requestId
    ? await sql`select user_id, title from requests where id = ${requestId}`
    : await sql`select user_id, title from listings where id = ${listingId}`;
  if (!topic) {
    return { ok: false, message: requestId ? "Публикацията не е намерена." : "Обявата не е намерена." };
  }
  if (topic.user_id === userId) return { ok: false, message: "Не можеш да пишеш на себе си." };

  const [existing] = await sql`
    select id from conversations
    where starter_id = ${userId}
      and request_id is not distinct from ${requestId} and listing_id is not distinct from ${listingId}`;
  if (existing) return { ok: true, id: existing.id };

  const [created] = await sql`
    insert into conversations (kind, request_id, listing_id, subject, starter_id, owner_id)
    values (${requestId ? "request" : "listing"}, ${requestId}, ${listingId}, ${topic.title}, ${userId}, ${topic.user_id})
    returning id`;
  return { ok: true, id: created.id };
}

// The user's conversations that have at least one message, the one written in last first.
export async function listConversations(userId: string) {
  const rows = await sql`
    select c.id, c.kind, c.request_id, c.listing_id, c.subject, c.last_message_at, ${userId}::uuid as viewer_id,
           u.username as other_username, u.avatar as other_avatar,
           last.body as last_body, last.sender_id as last_sender_id,
           (select count(*)::int from messages m
            where m.conversation_id = c.id and m.sender_id <> ${userId} and m.read_at is null) as unread
    from conversations c
    join users u on u.id = case when c.starter_id = ${userId} then c.owner_id else c.starter_id end
    join lateral (
      select body, sender_id from messages where conversation_id = c.id order by created_at desc limit 1
    ) last on true
    where c.starter_id = ${userId} or c.owner_id = ${userId}
    order by c.last_message_at desc`;
  return rows.map(toSummary);
}

// How many messages from other people the user has not opened yet, over all conversations.
export async function countUnreadMessages(userId: string) {
  const [row] = await sql`
    select count(*)::int as count
    from messages m join conversations c on c.id = m.conversation_id
    where (c.starter_id = ${userId} or c.owner_id = ${userId}) and m.sender_id <> ${userId} and m.read_at is null`;
  return row.count as number;
}

// One of the user's conversations with its messages, oldest first; null when it is not theirs.
// Reading it marks the other person's messages as opened.
export async function openConversation(userId: string, id: string) {
  if (!ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select c.id, c.kind, c.request_id, c.listing_id, c.subject, c.last_message_at, ${userId}::uuid as viewer_id,
           u.username as other_username, u.avatar as other_avatar
    from conversations c
    join users u on u.id = case when c.starter_id = ${userId} then c.owner_id else c.starter_id end
    where c.id = ${id} and (c.starter_id = ${userId} or c.owner_id = ${userId})`;
  if (!row) return null;

  await sql`
    update messages set read_at = now()
    where conversation_id = ${id} and sender_id <> ${userId} and read_at is null`;
  const messages = await sql`
    select id, body, sender_id, created_at from messages where conversation_id = ${id} order by created_at`;

  return {
    conversation: toSummary(row),
    messages: messages.map(
      (message): Message => ({
        id: message.id,
        body: message.body,
        mine: message.sender_id === userId,
        sentAt: new Date(message.created_at),
      }),
    ),
  };
}

type SendResult = { ok: true } | { ok: false; message: string } | null;

// Sends a message in one of the user's conversations; null when the conversation is not theirs.
export async function sendMessage(userId: string, conversationId: string, input: unknown): Promise<SendResult> {
  if (!ID_PATTERN.test(conversationId)) return null;
  const body = typeof input === "string" ? input.trim() : "";
  if (!body) return { ok: false, message: "Напиши съобщение." };
  if (body.length > MESSAGE_MAX) return { ok: false, message: `Съобщението е по-дълго от ${MESSAGE_MAX} знака.` };

  const [conversation] = await sql`
    select id from conversations
    where id = ${conversationId} and (starter_id = ${userId} or owner_id = ${userId})`;
  if (!conversation) return null;

  await sql`insert into messages (conversation_id, sender_id, body) values (${conversationId}, ${userId}, ${body})`;
  await sql`update conversations set last_message_at = now() where id = ${conversationId}`;
  return { ok: true };
}

// ---- for the administrator, who may read any conversation ----
// These only read: opening a conversation here does not mark anything as read, so the two people
// talking see no trace of it.

export type AdminConversation = {
  id: string;
  subject: string;
  kind: "request" | "listing";
  // The address of the post or listing, or null once it has been deleted.
  href: string | null;
  starter: { id: string; username: string; avatar: string | null };
  owner: { id: string; username: string; avatar: string | null };
  lastBody: string;
  lastAt: Date;
  messages: number;
};

const toAdminConversation = (row: Record<string, unknown>): AdminConversation => {
  const kind = row.kind === "request" ? "request" : "listing";
  const target = (kind === "request" ? row.request_id : row.listing_id) as string | null;
  return {
    id: row.id as string,
    subject: row.subject as string,
    kind,
    href: target ? `${kind === "request" ? "/search" : "/product"}/${target}` : null,
    starter: { id: row.starter_id as string, username: row.starter_username as string, avatar: row.starter_avatar as string | null },
    owner: { id: row.owner_id as string, username: row.owner_username as string, avatar: row.owner_avatar as string | null },
    lastBody: (row.last_body as string | null) ?? "",
    lastAt: new Date(row.last_message_at as string),
    messages: (row.messages as number | null) ?? 0,
  };
};

// Every conversation with at least one message, or only those one user takes part in, the one
// written in last first.
export async function listAllConversations(userId: string | null = null) {
  if (userId !== null && !ID_PATTERN.test(userId)) return [];
  const rows = await sql`
    select c.id, c.kind, c.request_id, c.listing_id, c.subject, c.last_message_at, c.starter_id, c.owner_id,
           s.username as starter_username, s.avatar as starter_avatar,
           o.username as owner_username, o.avatar as owner_avatar,
           last.body as last_body,
           (select count(*)::int from messages where conversation_id = c.id) as messages
    from conversations c
    join users s on s.id = c.starter_id
    join users o on o.id = c.owner_id
    join lateral (
      select body from messages where conversation_id = c.id order by created_at desc limit 1
    ) last on true
    where ${userId}::uuid is null or c.starter_id = ${userId} or c.owner_id = ${userId}
    order by c.last_message_at desc`;
  return rows.map(toAdminConversation);
}

export type AdminMessage = { id: string; body: string; senderId: string; sentAt: Date; readAt: Date | null };

// One conversation with all its messages, oldest first; null when there is none.
export async function readConversation(id: string) {
  if (!ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select c.id, c.kind, c.request_id, c.listing_id, c.subject, c.last_message_at, c.starter_id, c.owner_id,
           s.username as starter_username, s.avatar as starter_avatar,
           o.username as owner_username, o.avatar as owner_avatar
    from conversations c
    join users s on s.id = c.starter_id
    join users o on o.id = c.owner_id
    where c.id = ${id}`;
  if (!row) return null;

  const messages = await sql`
    select id, body, sender_id, created_at, read_at from messages where conversation_id = ${id} order by created_at`;
  return {
    conversation: toAdminConversation({ ...row, messages: messages.length }),
    messages: messages.map(
      (message): AdminMessage => ({
        id: message.id,
        body: message.body,
        senderId: message.sender_id,
        sentAt: new Date(message.created_at),
        readAt: message.read_at ? new Date(message.read_at) : null,
      }),
    ),
  };
}
