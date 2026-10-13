import { sendEmail } from "@/lib/email/send";
import { formatPrice } from "@/lib/format";

type PaidListing = {
  username: string;
  email: string;
  // In euro.
  amount: number;
  // Stripe's id of the payment, which the seller can quote if something is wrong with it.
  paymentId: string;
};

const dateFormat = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

// Tells the seller by email that the card payment for a listing went through. It confirms the
// payment and is not an invoice.
export function sendPaymentEmail({ username, email, amount, paymentId }: PaidListing) {
  const price = formatPrice(amount);
  const paidAt = dateFormat.format(new Date());
  // The site's own address, for the button; without one the email simply has no button.
  const site = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "");
  const link = site && `${site}/sell`;

  return sendEmail({
    to: email,
    subject: `Плащането ти в Козметарник е успешно – ${price}`,
    text: [
      `Здравей, ${username}!`,
      "",
      `Получихме плащането ти от ${price} за една платена обява. Вече можеш да я качиш${link ? `: ${link}` : "."}`,
      "",
      `Дата: ${paidAt}`,
      `Номер на плащането: ${paymentId}`,
      "",
      "Това писмо потвърждава плащането и не е фактура.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #4a2a33;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">Здравей, ${escapeHtml(username)}!</h1>
        <p style="font-size: 15px; line-height: 24px; margin: 0 0 24px;">
          Получихме плащането ти за една платена обява. Вече можеш да я качиш.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; margin: 0 0 24px;">
          <tr>
            <td style="padding: 8px 0; color: #8a7479;">Сума</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${price}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8a7479; border-top: 1px solid #f0e6e8;">Дата</td>
            <td style="padding: 8px 0; text-align: right; border-top: 1px solid #f0e6e8;">${paidAt}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #8a7479; border-top: 1px solid #f0e6e8;">Номер на плащането</td>
            <td style="padding: 8px 0; text-align: right; border-top: 1px solid #f0e6e8; word-break: break-all;">${escapeHtml(paymentId)}</td>
          </tr>
        </table>
        ${
          link
            ? `<a href="${link}" style="display: inline-block; background: #b75d71; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; padding: 12px 24px; border-radius: 12px;">
          Добави обява
        </a>`
            : ""
        }
        <p style="font-size: 13px; line-height: 20px; margin: 24px 0 0; color: #8a7479;">
          Това писмо потвърждава плащането и не е фактура.
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
