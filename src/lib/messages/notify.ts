import { hasMailbox } from "@/lib/auth/accountFields";
import { NEXT_PARAM } from "@/lib/auth/nextPath";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

type NewMessage = {
  conversationId: string;
  senderId: string;
  // The site's address, for the link back to the conversation, e.g. https://kosmetarnik.com.
  origin: string;
};

// Tells the other person in a conversation by email that a message has come for them, whether it
// is from a buyer or from an administrator of the site. The email says who wrote and about what,
// but not what: the message itself is read only on the site, behind the sign-in. Only the first of several messages they
// have not read yet is emailed, so a quick exchange does not fill their inbox: once they have
// read the conversation, the next message is emailed again. Accounts without a real mailbox, or
// whose email has not been confirmed, are not written to. Answers whether an email went out.
export async function notifyNewMessage({ conversationId, senderId, origin }: NewMessage) {
  const [row] = await sql`
    select c.subject, c.owner_id,
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

  // An administrator who answers about their own listing or post writes as its seller, under
  // their name; only one writing about somebody else's is introduced as the administrator.
  const fromAdmin = row.sender_role === "admin" && row.owner_id !== senderId;
  const sender = fromAdmin ? "Администраторът на Козметарник" : (row.sender_username as string);
  const subject = row.subject as string;
  // Through the home page: someone signed in is sent on to the conversation at once, anyone else
  // signs in first (see src/lib/auth/nextPath.ts).
  const conversation = `/profile/messages/${conversationId}`;
  const link = `${process.env.APP_URL ?? origin}/?${NEXT_PARAM}=${encodeURIComponent(conversation)}`;

  return sendEmail({
    to: email,
    subject: fromAdmin ? "Ново съобщение от администратора на Козметарник" : `Ново съобщение от ${sender} в Козметарник`,
    text: [
      `Здравей, ${row.recipient_username}!`,
      "",
      `${sender} ти изпрати съобщение относно „${subject}“.`,
      "",
      `Прочети го и отговори в Козметарник: ${link}`,
      "",
      "Докато не прочетеш съобщението, няма да ти изпращаме писмо за всяко следващо в този разговор.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #4a2a33;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Здравей, ${escapeHtml(row.recipient_username as string)}!</h1>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 24px;">
          <strong>${escapeHtml(sender)}</strong> ти изпрати съобщение относно „${escapeHtml(subject)}“.
          Прочети го и отговори в Козметарник.
        </p>
        <a href="${link}" style="display: inline-block; background: #b75d71; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
          Виж съобщението
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
