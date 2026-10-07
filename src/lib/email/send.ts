type Email = {
  to: string;
  subject: string;
  html: string;
  // Plain-text version for mail clients that don't show HTML.
  text: string;
};

// Emails go out through Resend (https://resend.com). Set RESEND_API_KEY and EMAIL_FROM in .env.
// Without a key nothing is sent: the message is printed to the server console instead, so the
// flows can be tried locally before a mail service is set up. Returns whether it really went out.
export async function sendEmail({ to, subject, html, text }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[email not sent: RESEND_API_KEY is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Cosmetarnic <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
  }
  return true;
}
