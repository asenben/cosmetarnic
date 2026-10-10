import { createHash } from "node:crypto";
import { getCategories } from "@/lib/categories";
import { sql } from "@/lib/db";
import { descriptionText, sanitizeDescription } from "@/lib/listings/description";
import { LISTING_IMAGE_PATTERN, MAX_LISTING_PHOTOS, listingImageKey } from "@/lib/listings/images";
import { deleteImage } from "@/lib/storage/deleteImage";

// The same limits the form in src/components/sell/ListingForm.tsx checks before sending.
const CONDITIONS = ["new", "used"] as const;
const DELIVERIES = ["pickup", "speedy", "econt", "boxnow", "pigeon"] as const;
const PRICE_MAX = 100000;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX_HTML = 20000;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;
export const LISTING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Listing = {
  id: string;
  // The id of the user who published it.
  userId: string;
  // Which listing this was in the order of publishing, starting from 1. Shown to people as its ID.
  number: number;
  title: string;
  brand: string;
  // The values of the categories it is in, at least one.
  categories: string[];
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
  number: Number(row.number),
  title: row.title as string,
  brand: row.brand as string,
  categories: row.categories as string[],
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
async function readListing(input: Record<string, unknown>) {
  const categories = await getCategories();
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
  // The categories chosen, in the order the site shows them; anything that is not one is dropped.
  const picked = Array.isArray(input.categories) ? input.categories : [];
  const chosen = categories.map(({ value }) => value).filter((value) => picked.includes(value));
  const condition = text("condition");
  const color = text("color").slice(0, 40);
  const phone = text("phone");
  const city = text("city");
  // A listing marked as free has no price to check; it is stored as 0.
  const free = input.free === true;
  const price = free ? 0 : Math.round(Number(text("price").replace(",", ".")) * 100) / 100;
  const offered = list("delivery");
  const delivery = DELIVERIES.filter((value) => offered.includes(value));
  const images = [...new Set(list("images"))];
  const html = text("description");
  const description = html.length <= DESCRIPTION_MAX_HTML ? sanitizeDescription(html) : "";

  if (descriptionText(description).length < DESCRIPTION_MIN) {
    errors.description = `Опиши продукта с поне ${DESCRIPTION_MIN} знака.`;
  }
  if (title.length < 3 || title.length > 120) errors.title = "Заглавието трябва да е поне 3 знака.";
  if (!free && !(price > 0 && price <= PRICE_MAX)) errors.price = "Въведи цена, по-голяма от 0, или отбележи „Безплатно“.";
  if (brand.length < 2 || brand.length > 60) errors.brand = "Въведи марката на продукта.";
  if (chosen.length === 0) errors.categories = "Избери поне една категория.";
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
    values: { title, brand, categories: chosen, condition, price, color: color || null, delivery, phone, city, description, images },
  };
}

export async function createListing(userId: string, input: Record<string, unknown>): Promise<SaveResult> {
  const read = await readListing(input);
  if (!read.ok) return read;
  const v = read.values;

  const [row] = await sql`
    insert into listings (user_id, title, brand, category, categories, condition, price, color, delivery, phone, city,
                          description, images)
    values (${userId}, ${v.title}, ${v.brand}, ${v.categories[0]}, ${v.categories}::text[], ${v.condition}, ${v.price}, ${v.color},
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

// Who is asking to change a listing: its owner may, and so may an administrator, whoever owns it.
export type ListingEditor = { id: string; role: string };
const anyOwner = (editor: ListingEditor) => editor.role === "admin";

// Saves the changes to a listing, made by its owner or by an administrator. Answers null when
// there is no such listing the editor may change.
export async function updateListing(
  editor: ListingEditor,
  id: string,
  input: Record<string, unknown>,
): Promise<SaveResult | null> {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const read = await readListing(input);
  if (!read.ok) return read;
  const v = read.values;

  const [before] = await sql`
    select images from listings where id = ${id} and (user_id = ${editor.id} or ${anyOwner(editor)})`;
  if (!before) return null;
  await sql`
    update listings
    set title = ${v.title}, brand = ${v.brand}, category = ${v.categories[0]}, categories = ${v.categories}::text[],
        condition = ${v.condition}, price = ${v.price}, color = ${v.color}, delivery = ${v.delivery}::text[], phone = ${v.phone},
        city = ${v.city}, description = ${v.description}, images = ${v.images}::text[]
    where id = ${id}`;
  // The photos the owner took out of the listing are no longer needed.
  await discardImages((before.images as string[]).filter((file) => !v.images.includes(file)));
  return { ok: true, id };
}

// Deletes a listing for good, with its photos, views and hearts, for its owner or for an
// administrator. Answers false when there is no such listing the editor may delete.
export async function deleteListing(editor: ListingEditor, id: string) {
  if (!LISTING_ID_PATTERN.test(id)) return false;
  const [removed] = await sql`
    delete from listings where id = ${id} and (user_id = ${editor.id} or ${anyOwner(editor)}) returning images`;
  if (!removed) return false;
  await discardImages(removed.images as string[]);
  return true;
}

// The listing as it is stored, for the form that edits it: for its owner or an administrator,
// null for anybody else.
export async function getEditableListing(editor: ListingEditor, id: string) {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l join users u on u.id = l.user_id
    where l.id = ${id} and (l.user_id = ${editor.id} or ${anyOwner(editor)})`;
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
// the title, the brand or the name of one of its categories, so "грим dior", "dior" and "грим" all work.
export async function getListings(search = "", limit: number | null = null) {
  const categories = await getCategories();
  const rows = await sql`
    with names as (
      select * from unnest(${categories.map(({ value }) => value)}::text[], ${categories.map(({ label }) => label)}::text[])
        as category (value, label)
    )
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l
    join users u on u.id = l.user_id
    where l.status = 'active' and u.blocked_at is null
      and not exists (
        select 1 from unnest(${searchWords(search)}::text[]) as word
        where position(word in lower(l.title || ' ' || l.brand || ' ' || coalesce(
          (select string_agg(names.label, ' ') from names where names.value = any (l.categories)), ''))) = 0
      )
    order by l.created_at desc
    limit ${limit}`;
  return rows.map(toListing);
}

// All of one user's listings, newest first.
export async function getUserListings(userId: string) {
  const rows = await sql`
    select l.*, u.username, u.avatar, u.created_at as seller_created_at, 0 as seller_listings
    from listings l join users u on u.id = l.user_id
    where l.user_id = ${userId}
    order by l.created_at desc`;
  return rows.map(toListing);
}

// How many listings the user has on sale. A listing whose product is gone is deleted by its
// owner, so there is no count of sold ones: `sold` stays 0 for the profile's tiles.
export async function countUserListings(userId: string) {
  const [row] = await sql`select count(*)::int as active from listings where status = 'active' and user_id = ${userId}`;
  return { active: row.active as number, sold: 0 };
}

// What tells one visitor's device from another's: its network address and browser. Only a hash of
// the two is kept, so the table of views holds no addresses.
export const viewerKey = (address: string, userAgent: string) =>
  createHash("sha256").update(`${address}|${userAgent}`).digest("hex");

// The listing for its own page, or null when there is none. Opening the page counts
// as a view the first time a device does it; the seller looking at their own listing is not counted.
// A blocked seller's listing is there only for an administrator.
export async function viewListing(id: string, viewer: { key: string; userId?: string; admin?: boolean }) {
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
    where l.id = ${id} and (u.blocked_at is null or ${viewer.admin === true})`;
  return row ? toListing(row) : null;
}

// The listing's title for the browser tab, without counting a view; null when there is none.
export async function getListingTitle(id: string) {
  if (!LISTING_ID_PATTERN.test(id)) return null;
  const [row] = await sql`select title from listings where id = ${id}`;
  return (row?.title as string | undefined) ?? null;
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
