import { cache } from "react";
import { sql } from "@/lib/db";

// Paid listings. A seller has a number of listings for free; each one past that number is paid
// for before it is published. The administrator sets the number, the price and the texts in
// "Плащания", and they are kept as one value in the settings table.
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
};

export const DEFAULT_FEE: ListingFee = {
  enabled: false,
  freeListings: 3,
  price: 0.8,
  title: "Платена обява",
  description: "Първите ти обяви са безплатни. Всяка следваща се заплаща, преди да бъде качена.",
};

export const FEE_LIMITS = { freeListings: 1000, price: 1000, title: 60, description: 600, credits: 1000 };

// The least Stripe accepts for one card payment in euro.
export const PRICE_MIN = 0.5;

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const errors: FeeErrors = {};
  if (!Number.isInteger(freeListings) || freeListings < 0 || freeListings > FEE_LIMITS.freeListings) {
    errors.freeListings = `Въведи цяло число от 0 до ${FEE_LIMITS.freeListings}.`;
  }
  if (!(price >= PRICE_MIN && price <= FEE_LIMITS.price)) {
    errors.price = "Най-малката цена за плащане с карта е 0,50 €.";
  }
  if (title.length < 2 || title.length > FEE_LIMITS.title) {
    errors.title = `Заглавието трябва да е от 2 до ${FEE_LIMITS.title} знака.`;
  }
  if (description.length > FEE_LIMITS.description) errors.description = `Най-много ${FEE_LIMITS.description} знака.`;
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const fee: ListingFee = { enabled: input.enabled === true, freeListings, price, title, description };
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