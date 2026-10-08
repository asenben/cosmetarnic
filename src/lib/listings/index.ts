import { createHash } from "node:crypto";
import { categories } from "@/data/listingOptions";
import { sql } from "@/lib/db";
import { descriptionText, sanitizeDescription } from "@/lib/listings/description";
import { LISTING_IMAGE_PATTERN, MAX_LISTING_PHOTOS, listingImageKey } from "@/lib/listings/images";
import { deleteImage } from "@/lib/storage/deleteImage";

// The same limits the form in src/components/sell/ListingForm.tsx checks before sending.
const CONDITIONS = ["new", "used"] as const;
const DELIVERIES = ["pickup", "speedy", "econt"] as const;
const PRICE_MAX = 100000;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX_HTML = 20000;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;
export const LISTING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Listing = {
  id: string;
  // The id of the user who published it.
  userId: string;
  // A sold listing is off the marketplace and the search, but its page stays for those with the link.
  sold: boolean;
  // Which listing this was in the order of publishing, starting from 1. Shown to people as its ID.
  number: number;
  title: string;
  brand: string;
  category: string;
  condition: (typeof CONDITIONS)[number];
  price: number;
  color: string;
  delivery: (typeof DELIVERIES)[number][];
  phone: string;
  city: string;
  // Already cleaned by sanitizeDescription, so it can be put on the page as HTML.
  description: string;
  // File names in the bucket, cover first (see images.ts).
  images: string[];
  // How many different devices have opened the listing. Only viewListing fills it in.
  views: number;
  createdAt: Date;
  seller: { username: string; avatar: string | null; createdAt: Date; listings: number };
};

const toListing = (row: Record<string, unknown>): Listing => ({
  id: row.id as string,
  userId: row.user_id as string,
  sold: row.status === "sold",
  number: Number(row.number),
  title: row.title as string,
  brand: row.brand as string,
  category: row.category as string,
  condition: row.condition as Listing["condition"],
  price: Number(row.price),
  color: (row.color as string | null) ?? "",
  delivery: row.delivery as Listing["delivery"],
  phone: row.phone as string,
  city: row.city as string,
  description: row.description as string,
  images: row.images as string[],
  views: (row.views as number | undefined) ?? 0,
  createdAt: new Date(row.created_at as string),
  seller: {
    username: row.username as string,
    avatar: row.avatar as string | null,
    createdAt: new Date(row.seller_created_at as string),
    listings: row.seller_listings as number,
  },
});

type FieldErrors = Record<string, string>;
type SaveResult = { ok: true; id: string } | { ok: false; errors: FieldErrors };

// Checks what the listing form sent. Answers with the values ready to store, or with what is
// wrong with each field.
function readListing(input: Record<string, unknown>) {
  const text = (name: string) => {
    const value = input[name];
    return typeof value === "string" ? value.trim() : "";
  };
  const list = (name: string) => {
    const value = input[name];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  };
  const errors: FieldErrors = {};

  const title = text("title");
  const brand = text("brand");
  const category = text("category");
  const condition = text("condition");
  const color = text("color").slice(0, 40);
  const phone = text("phone");
  const city = text("city");
  const price = Math.round(Number(text("price").replace(",", ".")) * 100) / 100;
  const offered = list("delivery");
  const delivery = DELIVERIES.filter((value) => offered.includes(value));
  const images = [...new Set(list("images"))];
  const html = text("description");
  const description = html.length <= DESCRIPTION_MAX_HTML ? sanitizeDescription(html) : "";

  if (descriptionText(description).length < DESCRIPTION_MIN) {
    errors.description = `Опиши продукта с поне ${DESCRIPTION_MIN} знака.`;
  }
  if (title.length < 3 || title.length > 120) errors.title = "Заглавието трябва да е поне 3 знака.";
  if (!(price > 0 && price <= PRICE_MAX)) errors.price = "Въведи цена, по-голяма от 0.";
  if (brand.length < 2 || brand.length > 60) errors.brand = "Въведи марката на продукта.";
  if (!categories.some(({ value }) => value === category)) errors.category = "Избери категория.";
  if (!CONDITIONS.some((value) => value === condition)) errors.condition = "Избери състояние.";
  if (delivery.length === 0) errors.delivery = "Избери поне един начин на доставка.";
  if (!PHONE_PATTERN.test(phone)) errors.phone = "Въведи валиден телефонен номер.";
  if (!city || city.length > 60) errors.city = "Въведи град.";
  if (images.length > MAX_LISTING_PHOTOS || images.some((file) => !LISTING_IMAGE_PATTERN.test(file))) {
    errors.photos = "Снимките не можаха да бъдат приети. Добави ги отново.";
  }
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  return {
    ok: true as const,
    values: { title, brand, category, condition, price, color: color || null, delivery, phone, city, description, images },
  };
}

export async function createListing(userId: string, input: Record<string, unknown>): Promise<SaveResult> {
  const read = readListing(input);
  if (!read.ok) return read;
  const v = read.values;

  const [row] = await sql`
    insert into listings (user_id, title, brand, category, condition, price, color, delivery, phone, city, description, images)
    values (${userId}, ${v.title}, ${v.brand}, ${v.category}, ${v.condition}, ${v.price}, ${v.color},
            ${v.delivery}::text[], ${v.phone}, ${v.city}, ${v.description}, ${v.images}::text[])
    returning id`;
  return { ok: true, id: row.id };
}

// Removes photos from the bucket, except those some listing still shows. A leftover file is
// harmless, so a failure here is only logged.
async function discardImages(files: string[]) {
  for (const file of files) {
    try {
      const [used] = await sql`select 1 from listings where ${file} = any (images) limit 1`;
      if (!used) await deleteImage(listingImageKey(file));
    } catch (error) {
      console.error("Listing photo could not be deleted", error);
    }
  }
}

// Saves the owner's changes to a listing. Answers null when there is no such listing of theirs.
export async function updateListing(
  userId: string,
  id: string,
  input: Record<string, unknown>,
): Promise<SaveResult | null> {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const read = readListing(input);
  if (!read.ok) return read;
  const v = read.values;

  const [before] = await sql`select images from listings where id = ${id} and user_id = ${userId}`;
  if (!before) return null;
  await sql`
    update listings
    set title = ${v.title}, brand = ${v.brand}, category = ${v.category}, condition = ${v.condition},
        price = ${v.price}, color = ${v.color}, delivery = ${v.delivery}::text[], phone = ${v.phone},
        city = ${v.city}, description = ${v.description}, images = ${v.images}::text[]
    where id = ${id} and user_id = ${userId}`;
  // The photos the owner took out of the listing are no longer needed.
  await discardImages((before.images as string[]).filter((file) => !v.images.includes(file)));
  return { ok: true, id };
}

// Deletes the owner's listing for good, with its photos, views and hearts. Answers false when
// there is no such listing of theirs.
export async function deleteListing(userId: string, id: string) {
  if (!LISTING_ID_PATTERN.test(id)) return false;
  const [removed] = await sql`delete from listings where id = ${id} and user_id = ${userId} returning images`;
  if (!removed) return false;
  await discardImages(removed.images as string[]);
  return true;
}

// The owner's listing as it is stored, for the form that edits it; null for anybody else.
export async function getOwnListing(userId: string, id: string) {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l join users u on u.id = l.user_id
    where l.id = ${id} and l.user_id = ${userId}`;
  return row ? toListing(row) : null;
}

// The words of a search, lower-cased. A listing matches when every one of them is found in it.
const searchWords = (search: string) =>
  search
    .toLocaleLowerCase("bg")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.slice(0, 40))
    .slice(0, 6);

// The listings on sale, newest first. With `search`, only those where every word typed is part of
// the title, the brand or the category's name, so "грим dior", "dior" and "грим" all work.
export async function getListings(search = "", limit: number | null = null) {
  const rows = await sql`
    with names as (
      select * from unnest(${categories.map(({ value }) => value)}::text[], ${categories.map(({ label }) => label)}::text[])
        as category (value, label)
    )
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l
    join users u on u.id = l.user_id
    left join names on names.value = l.category
    where l.status = 'active'
      and not exists (
        select 1 from unnest(${searchWords(search)}::text[]) as word
        where position(word in lower(l.title || ' ' || l.brand || ' ' || coalesce(names.label, ''))) = 0
      )
    order by l.created_at desc
    limit ${limit}`;
  return rows.map(toListing);
}

// All of one user's listings, on sale and sold, newest first.
export async function getUserListings(userId: string) {
  const rows = await sql`
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l join users u on u.id = l.user_id
    where l.user_id = ${userId}
    order by l.created_at desc`;
  return rows.map(toListing);
}

// How many listings the user has on sale and how many they have sold.
export async function countUserListings(userId: string) {
  const [row] = await sql`
    select count(*) filter (where status = 'active')::int as active,
           count(*) filter (where status = 'sold')::int as sold
    from listings where user_id = ${userId}`;
  return { active: row.active as number, sold: row.sold as number };
}

// Marks the owner's listing as sold, or puts it back on sale. Answers false when there is no
// such listing of theirs.
export async function setListingSold(userId: string, id: string, sold: boolean) {
  if (!LISTING_ID_PATTERN.test(id)) return false;
  const changed = await sql`
    update listings
    set status = ${sold ? "sold" : "active"}, sold_at = ${sold ? new Date().toISOString() : null}
    where id = ${id} and user_id = ${userId}
    returning id`;
  return changed.length > 0;
}

// What tells one visitor's device from another's: its network address and browser. Only a hash of
// the two is kept, so the table of views holds no addresses.
export const viewerKey = (address: string, userAgent: string) =>
  createHash("sha256").update(`${address}|${userAgent}`).digest("hex");

// The listing for its own page, sold or not, or null when there is none. Opening the page counts
// as a view the first time a device does it; the seller looking at their own listing is not counted.
export async function viewListing(id: string, viewer: { key: string; userId?: string }) {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    with seen as (
      insert into listing_views (listing_id, viewer)
      select id, ${viewer.key} from listings
      where id = ${id} and status = 'active' and user_id is distinct from ${viewer.userId ?? null}
      on conflict do nothing
      returning listing_id
    )
    select l.*, u.username, u.avatar, u.created_at as seller_created_at,
           (select count(*)::int from listings where user_id = l.user_id and status = 'active') as seller_listings,
           -- The view added just above is not visible to this query yet, so it is counted separately.
           (select count(*)::int from listing_views where listing_id = l.id) + (select count(*)::int from seen) as views
    from listings l join users u on u.id = l.user_id
    where l.id = ${id}`;
  return row ? toListing(row) : null;
}

// "преди 5 минути", "преди 2 дни": how long ago a listing was published.
export function postedAgo(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  const ago = (count: number, one: string, many: string) => `преди ${count} ${count === 1 ? one : many}`;
  if (minutes < 1) return "току-що";
  if (minutes < 60) return ago(minutes, "минута", "минути");
  if (minutes < 60 * 24) return ago(Math.floor(minutes / 60), "час", "часа");
  const days = Math.floor(minutes / (60 * 24));
  if (days < 30) return ago(days, "ден", "дни");
  if (days < 365) return ago(Math.floor(days / 30), "месец", "месеца");
  return ago(Math.floor(days / 365), "година", "години");
}
