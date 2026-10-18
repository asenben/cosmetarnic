import { hasMailbox } from "@/lib/auth/accountFields";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

// How much of the message the email quotes; the rest is read on the site.
const PREVIEW_LENGTH = 300;

type NewMessage = {
  conversationId: string;
  senderId: string;
  body: string;
  // The site's address, for the link back to the conversation, e.g. https://kosmetarnik.com.
  origin: string;
};

// Tells the other person in a conversation by email that a message has come for them, whether it
// is from a buyer or from an administrator of the site. Only the first of several messages they
// have not read yet is emailed, so a quick exchange does not fill their inbox: once they have
// read the conversation, the next message is emailed again. Accounts without a real mailbox, or
// whose email has not been confirmed, are not written to. Answers whether an email went out.
export async function notifyNewMessage({ conversationId, senderId, body, origin }: NewMessage) {
  const [row] = await sql`
    select c.subject,
           r.username as recipient_username, r.email as recipient_email,
           r.email_verified_at is not null as recipient_verified, r.blocked_at is not null as recipient_blocked,
           s.username as sender_username, s.role as sender_role,
           (select count(*)::int from messages m
            where m.conversation_id = c.id and m.sender_id = ${senderId} and m.read_at is null) as unread
    from conversations c
    join users r on r.id = case when c.starter_id = ${senderId} then c.owner_id else c.starter_id end
    join users s on s.id = ${senderId}
    where c.id = ${conversationId}`;
  if (!row) return false;

  const email = row.recipient_email as string;
  // The new message is one of the unread ones; any more and the person has been told already.
  if ((row.unread as number) > 1) return false;
  if (!hasMailbox(email) || !row.recipient_verified || row.recipient_blocked) return false;

  const fromAdmin = row.sender_role === "admin";
  const sender = fromAdmin ? "Администраторът на Козметарник" : (row.sender_username as string);
  const subject = row.subject as string;
  const preview = body.length > PREVIEW_LENGTH ? `${body.slice(0, PREVIEW_LENGTH).trimEnd()}…` : body;
  const link = `${process.env.APP_URL ?? origin}/profile/messages/${conversationId}`;

  return sendEmail({
    to: email,
    subject: fromAdmin ? "Ново съобщение от администратора на Козметарник" : `Ново съобщение от ${sender} в Козметарник`,
    text: [
      `Здравей, ${row.recipient_username}!`,
      "",
      `${sender} ти писа относно „${subject}“:`,
      "",
      preview,
      "",
      `Отговори тук: ${link}`,
      "",
      "Докато не прочетеш съобщението, няма да ти изпращаме писмо за всяко следващо в този разговор.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #4a2a33;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Здравей, ${escapeHtml(row.recipient_username as string)}!</h1>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 16px;">
          <strong>${escapeHtml(sender)}</strong> ти писа относно „${escapeHtml(subject)}“:
        </p>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 24px; padding: 12px 16px; background: #f9eef1; border-radius: 12px; white-space: pre-line;">${escapeHtml(preview)}</p>
        <a href="${link}" style="display: inline-block; background: #b75d71; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
          Отговори
        </a>
        <p style="font-size: 13px; line-height: 20px; margin: 24px 0 0; color: #8a7479;">
          Докато не прочетеш съобщението, няма да ти изпращаме писмо за всяко следващо в този разговор.
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
