import { hashToken, newToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";

const LINK_MINUTES = 60;
// A new link is not sent more often than this, so the form can't be used to flood an inbox.
const RESEND_AFTER_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ForgotPasswordResult = { ok: true } | { ok: false; message: string };

// `origin` is the site address the link should open, e.g. https://example.com.
// Succeeds whether or not an account has that email, so the form doesn't reveal who is registered.
export async function requestPasswordReset(
  input: Record<string, unknown>,
  origin: string,
): Promise<ForgotPasswordResult> {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "Въведи валиден имейл адрес." };
  }

  const [user] = await sql`select id, username, email from users where lower(email) = ${email} limit 1`;
  if (!user) return { ok: true };

  const [recent] = await sql`
    select 1 from password_resets
    where user_id = ${user.id} and created_at > now() - (${RESEND_AFTER_SECONDS}::int * interval '1 second')
    limit 1
  `;
  if (recent) return { ok: true };

  const token = newToken();
  await sql`
    insert into password_resets (token_hash, user_id, expires_at)
    values (${hashToken(token)}, ${user.id}, now() + (${LINK_MINUTES}::int * interval '1 minute'))
  `;

  // Opens the site with the new-password form; see RESET_TOKEN_PARAM in AuthProvider.
  const link = `${process.env.APP_URL ?? origin}/?reset_token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Нова парола за Козметарник",
      text: [
        `Здравей, ${user.username}!`,
        "",
        "Получихме заявка за нова парола за профила ти в Козметарник. Отвори връзката, за да я зададеш:",
        link,
        "",
        `Връзката е валидна ${LINK_MINUTES} минути. Ако не си поискал нова парола ти, не обръщай внимание на това писмо – паролата ти остава същата.`,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #4a2a33;">
          <h1 style="font-size: 22px; margin: 0 0 16px;">Здравей, ${escapeHtml(user.username)}!</h1>
          <p style="font-size: 15px; line-height: 24px; margin: 0 0 24px;">
            Получихме заявка за нова парола за профила ти в Козметарник.
          </p>
          <a href="${link}" style="display: inline-block; background: #b75d71; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
            Задай нова парола
          </a>
          <p style="font-size: 13px; line-height: 20px; margin: 24px 0 0; color: #8a7479;">
            Връзката е валидна ${LINK_MINUTES} минути. Ако бутонът не работи, копирай този адрес в браузъра:<br />
            <a href="${link}" style="color: #b75d71; word-break: break-all;">${link}</a>
          </p>
          <p style="font-size: 13px; line-height: 20px; margin: 16px 0 0; color: #8a7479;">
            Ако не си поискал нова парола ти, не обръщай внимание на това писмо – паролата ти остава същата.
          </p>
        </div>
      `,
    });
  } catch (error) {
    // Reported the same as success, so a mail outage doesn't reveal which emails are registered.
    console.error("Password reset email failed", error);
  }
  return { ok: true };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
