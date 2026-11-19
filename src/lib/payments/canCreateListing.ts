import { cache } from "react";
import { sql } from "@/lib/db";

// Paid listings. A seller has a number of listings for free; each one past that number is paid
// for before it is published, by a bank transfer to the platform's account. The administrator
// sets the number, the price, the texts and the account in "Плащания", and they are kept as one
// value in the settings table. Once the money has arrived, the administrator adds the paid listing
// to the seller from the seller's page in "Потребители".
export type ListingFee = {
  // While off, nobody is limited and nothing is asked for.
  enabled: boolean;
  // How many listings a seller can have at a time without paying.
  freeListings: number;
  // What one listing past the free ones costs, in euro.
  price: number;
  // The heading and the text of the window the seller is shown.
  title: string;
  description: string;
  // The account the seller transfers the money to.
  recipient: string;
  // Kept without spaces, in capitals; shown in groups of four.
  iban: string;
  // The bank's code; may be left empty.
  bic: string;
};

export const DEFAULT_FEE: ListingFee = {
  enabled: false,
  freeListings: 3,
  price: 0.8,
  title: "Платена обява",
  description:
    "Всеки потребител може да има до 3 безплатни обяви. За всяка следваща преведи сумата по банковата сметка по-долу. Обявата се отключва, щом преводът бъде получен.",
  recipient: "",
  iban: "",
  bic: "",
};

export const FEE_LIMITS = {
  freeListings: 1000,
  price: 1000,
  title: 60,
  description: 600,
  credits: 1000,
  recipient: 100,
};

// An IBAN as it is stored, and the check of its two control digits (ISO 13616: the country and the
// digits moved to the end, letters turned into numbers, and the whole taken modulo 97 gives 1).
export const normalizeIban = (value: string) => value.replace(/\s+/g, "").toUpperCase();

export function isValidIban(iban: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let rest = 0;
  for (const digit of digits) rest = (rest * 10 + Number(digit)) % 97;
  return rest === 1;
}

// "BG80BNBG96611020345678" → "BG80 BNBG 9661 1020 3456 78", as banks print it.
export const formatIban = (iban: string) => iban.replace(/(.{4})(?=.)/g, "$1 ");

// What the payment window shows, with the IBAN ready to be read.
export const bankTransfer = ({ title, description, price, recipient, iban, bic }: ListingFee) => ({
  title,
  description,
  price,
  recipient,
  iban: formatIban(iban),
  bic,
});

// The reason the seller writes on the transfer, by which the administrator tells whose it is.
export const transferReference = (username: string) => `Обява ${username}`;

const ID_PATTERN =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The fee as it is set now. Asked once per request, however many parts of the page need it.
export const getListingFee = cache(async (): Promise<ListingFee> => {
  const [row] = await sql`select value from settings where key = 'listing_fee'`;
  const stored = (row?.value ?? {}) as Partial<ListingFee>;
  return {
    enabled: stored.enabled ?? DEFAULT_FEE.enabled,
    freeListings: stored.freeListings ?? DEFAULT_FEE.freeListings,
    price: stored.price ?? DEFAULT_FEE.price,
    title: stored.title ?? DEFAULT_FEE.title,
    description: stored.description ?? DEFAULT_FEE.description,
    recipient: stored.recipient ?? DEFAULT_FEE.recipient,
    iban: stored.iban ?? DEFAULT_FEE.iban,
    bic: stored.bic ?? DEFAULT_FEE.bic,
  };
});

export type FeeErrors = Partial<Record<keyof ListingFee, string>>;
export type FeeResult = { ok: true } | { ok: false; errors: FeeErrors };

// Saves the administrator's changes.
export async function setListingFee(input: Record<string, unknown>): Promise<FeeResult> {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const number = (value: unknown) => Number(typeof value === "string" ? value.replace(",", ".") : value);

  const freeListings = number(input.freeListings);
  const price = Math.round(number(input.price) * 100) / 100;
  const title = text(input.title);
  const description = text(input.description);
  const recipient = text(input.recipient);
  const iban = normalizeIban(text(input.iban));
  const bic = normalizeIban(text(input.bic));
  const enabled = input.enabled === true;

  const errors: FeeErrors = {};
  if (!Number.isInteger(freeListings) || freeListings < 0 || freeListings > FEE_LIMITS.freeListings) {
    errors.freeListings = `Въведи цяло число от 0 до ${FEE_LIMITS.freeListings}.`;
  }
  if (!(price > 0 && price <= FEE_LIMITS.price)) errors.price = `Въведи цена над 0 и до ${FEE_LIMITS.price} €.`;
  if (title.length < 2 || title.length > FEE_LIMITS.title) {
    errors.title = `Заглавието трябва да е от 2 до ${FEE_LIMITS.title} знака.`;
  }
  if (description.length > FEE_LIMITS.description) errors.description = `Най-много ${FEE_LIMITS.description} знака.`;
  // The account may stay empty while the paid listings are off, but nobody is asked to pay without one.
  if (recipient.length > FEE_LIMITS.recipient) errors.recipient = `Най-много ${FEE_LIMITS.recipient} знака.`;
  else if (enabled && recipient.length < 2) errors.recipient = "Въведи на чие име е сметката.";
  if (iban ? !isValidIban(iban) : enabled) errors.iban = "Въведи валиден IBAN.";
  if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) errors.bic = "Въведи валиден BIC или го остави празно.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const fee: ListingFee = { enabled, freeListings, price, title, description, recipient, iban, bic };
  await sql`
    insert into settings (key, value) values ('listing_fee', ${JSON.stringify(fee)}::jsonb)
    on conflict (key) do update set value = excluded.value`;
  return { ok: true };
}

export type ListingAllowance = {
  allowed: boolean;
  // Whether the next listing is one past the free ones, which uses up a paid listing.
  paid: boolean;
  // How many listings the seller has now, how many are free, and how many are paid for and waiting.
  used: number;
  limit: number;
  credits: number;
};

// Whether the user may publish one more listing. Administrators are not limited, and nobody is
// while the fee is switched off.
export async function canCreateListing(user: { id: string; role: string }): Promise<ListingAllowance> {
  const fee = await getListingFee();
  const [row] = await sql`
    select (select count(*)::int from listings where user_id = u.id and status = 'active') as used, u.listing_credits
    from users u where u.id = ${user.id}`;
  const used = (row?.used as number | undefined) ?? 0;
  const credits = (row?.listing_credits as number | undefined) ?? 0;
  const paid = fee.enabled && user.role !== "admin" && used >= fee.freeListings;
  return { allowed: !paid || credits > 0, paid, used, limit: fee.freeListings, credits };
}

// Uses up one of the seller's paid listings, once the listing it paid for is published.
export async function spendPaidListing(userId: string) {
  await sql`update users set listing_credits = listing_credits - 1 where id = ${userId} and listing_credits > 0`;
}

// The sellers who have paid listings waiting to be published, those with the most first.
export async function listPaidSellers() {
  const rows = await sql`
    select id, username, listing_credits from users where listing_credits > 0 order by listing_credits desc, username`;
  return rows.map((row) => ({
    id: row.id as string,
    username: row.username as string,
    credits: row.listing_credits as number,
  }));
}

// Adds paid listings to a seller's account, or takes some away with a negative number. Done by
// the administrator once the seller has paid. Answers false when there is no such account.
export async function addPaidListings(userId: string, count: number) {
  if (!ID_PATTERN.test(userId) || !Number.isInteger(count)) return false;
  const changed = await sql`
    update users set listing_credits = least(${FEE_LIMITS.credits}, greatest(0, listing_credits + ${count}))
    where id = ${userId} returning id`;
  return changed.length > 0;
}