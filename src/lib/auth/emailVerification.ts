import { hashToken, newToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

const LINK_HOURS = 24;
// A new link is not sent more often than this, so the sign-in form can't be used to flood an inbox.
const RESEND_AFTER_SECONDS = 60;

type Recipient = { id: string; username: string; email: string };

// `origin` is the site address the link should open, e.g. https://example.com.
// Returns false when no mail service is configured and the email was only logged.
export async function sendVerificationEmail(user: Recipient, origin: string) {
  const token = newToken();
  await sql`
    insert into email_verifications (token_hash, user_id, expires_at)
    values (${hashToken(token)}, ${user.id}, now() + (${LINK_HOURS}::int * interval '1 hour'))
  `;

  const link = `${process.env.APP_URL ?? origin}/api/auth/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: "Потвърди имейла си в Козметарник",
    text: [
      `Здравей, ${user.username}!`,
      "",
      "Благодарим ти за регистрацията в Козметарник. Отвори връзката, за да потвърдиш имейла си и да влезеш в профила си:",
      link,
      "",
      `Връзката е валидна ${LINK_HOURS} часа. Ако не си се регистрирал ти, просто не обръщай внимание на това писмо.`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #4a2a33;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Здравей, ${escapeHtml(user.username)}!</h1>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 24px;">
          Благодарим ти за регистрацията в Козметарник. Потвърди имейла си, за да влезеш в профила си.
        </p>
        <a href="${link}" style="display: inline-block; background: #b75d71; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
          Потвърди имейла
        </a>
        <p style="font-size: 13px; line-height: 20px; margin: 24px 0 0; color: #8a7479;">
          Връзката е валидна ${LINK_HOURS} часа. Ако бутонът не работи, копирай този адрес в браузъра:<br />
          <a href="${link}" style="color: #b75d71; word-break: break-all;">${link}</a>
        </p>
        <p style="font-size: 13px; line-height: 20px; margin: 16px 0 0; color: #8a7479;">
          Ако не си се регистрирал ти, просто не обръщай внимание на това писмо.
        </p>
      </div>
    `,
  });
}

// For someone who tries to sign in before confirming: sends a fresh link unless one just went out.
export async function resendVerificationEmail(user: Recipient, origin: string) {
  const [recent] = await sql`
    select 1 from email_verifications
    where user_id = ${user.id} and created_at > now() - (${RESEND_AFTER_SECONDS}::int * interval '1 second')
    limit 1
  `;
  if (recent) return false;

  return sendVerificationEmail(user, origin);
}

// Marks the account as confirmed. Returns false for an unknown, used or expired link.
export async function verifyEmail(token: string) {
  const [verification] = await sql`
    delete from email_verifications
    where token_hash = ${hashToken(token)} and expires_at > now()
    returning user_id
  `;
  if (!verification) return false;

  await sql`update users set email_verified_at = coalesce(email_verified_at, now()) where id = ${verification.user_id}`;
  // Any other links sent to this account are no longer needed.
  await sql`delete from email_verifications where user_id = ${verification.user_id}`;
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
