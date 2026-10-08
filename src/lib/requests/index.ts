import { categories } from "@/data/listingOptions";
import { sql } from "@/lib/db";
import { LISTING_IMAGE_PATTERN, listingImageKey } from "@/lib/listings/images";
import { deleteImage } from "@/lib/storage/deleteImage";

// A "Търся" post: a registered user describing a product they are looking for, so that sellers
// who have it can get in touch. It is not a listing: nothing is on sale.

// "any" is for somebody who does not mind whether the product is new or used.
const CONDITIONS = ["new", "used", "any"] as const;
const BUDGET_MAX = 100000;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 1000;
const PHONE_PATTERN = /^\+?[\d\s]{7,15}$/;
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProductRequest = {
  id: string;
  userId: string;
  // What is being looked for, e.g. "Парфюм Dior Sauvage 100 мл".
  title: string;
  // The brand wanted, or "" when any will do.
  brand: string;
  category: string;
  condition: (typeof CONDITIONS)[number];
  // The most the person would pay, in euro; null when they did not say.
  budget: number | null;
  city: string;
  description: string;
  // A picture of the product wanted, if the author added one. It is stored like a listing's
  // photo: the file name in the bucket (see src/lib/listings/images.ts).
  image: string | null;
  createdAt: Date;
  author: { username: string; avatar: string | null };
  // Whether the user the posts were loaded for marked this one with the heart.
  favorite: boolean;
};

const toRequest = (row: Record<string, unknown>): ProductRequest => ({
  id: row.id as string,
  userId: row.user_id as string,
  title: row.title as string,
  brand: (row.brand as string | null) ?? "",
  category: row.category as string,
  condition: row.condition as ProductRequest["condition"],
  budget: row.budget === null ? null : Number(row.budget),
  city: row.city as string,
  description: row.description as string,
  image: (row.image as string | null) ?? null,
  createdAt: new Date(row.created_at as string),
  author: { username: row.username as string, avatar: row.avatar as string | null },
  favorite: row.favorite === true,
});

type FieldErrors = Record<string, string>;
type SaveResult = { ok: true; id: string } | { ok: false; errors: FieldErrors };

// Checks what the form sent. Answers with the values ready to store, or with what is wrong with
// each field.
function readRequest(input: Record<string, unknown>) {
  const text = (name: string) => {
    const value = input[name];
    return typeof value === "string" ? value.trim() : "";
  };
  const errors: FieldErrors = {};

  const title = text("title");
  const brand = text("brand").slice(0, 60);
  const category = text("category");
  const condition = text("condition");
  const city = text("city");
  const phone = text("phone");
  const description = text("description");
  const image = text("image");
  // The budget is optional; when given it has to be a real amount.
  const budgetText = text("budget").replace(",", ".");
  const budget = budgetText ? Math.round(Number(budgetText) * 100) / 100 : null;

  if (title.length < 3 || title.length > 120) errors.title = "Напиши какво търсиш с поне 3 знака.";
  if (!categories.some(({ value }) => value === category)) errors.category = "Избери категория.";
  if (!CONDITIONS.some((value) => value === condition)) errors.condition = "Избери състояние.";
  if (budget !== null && !(budget > 0 && budget <= BUDGET_MAX)) errors.budget = "Въведи сума, по-голяма от 0.";
  if (!city || city.length > 60) errors.city = "Въведи град.";
  if (!PHONE_PATTERN.test(phone)) errors.phone = "Въведи валиден телефонен номер.";
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
    errors.description = `Опиши какво търсиш с поне ${DESCRIPTION_MIN} знака.`;
  }
  if (image && !LISTING_IMAGE_PATTERN.test(image)) errors.image = "Снимката не можа да бъде приета. Добави я отново.";
  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  return {
    ok: true as const,
    values: { title, brand: brand || null, category, condition, budget, city, phone, description, image: image || null },
  };
}

// Removes a post's picture from the bucket, unless a post or a listing still shows it. A leftover
// file is harmless, so a failure here is only logged.
async function discardImage(file: string | null) {
  if (!file) return;
  try {
    const [used] = await sql`
      select 1 from requests where image = ${file}
      union all select 1 from listings where ${file} = any (images) limit 1`;
    if (!used) await deleteImage(listingImageKey(file));
  } catch (error) {
    console.error("Request picture could not be deleted", error);
  }
}

export async function createRequest(userId: string, input: Record<string, unknown>): Promise<SaveResult> {
  const read = readRequest(input);
  if (!read.ok) return read;
  const v = read.values;

  const [row] = await sql`
    insert into requests (user_id, title, brand, category, condition, budget, city, phone, description, image)
    values (${userId}, ${v.title}, ${v.brand}, ${v.category}, ${v.condition}, ${v.budget}, ${v.city}, ${v.phone},
            ${v.description}, ${v.image})
    returning id`;
  return { ok: true, id: row.id };
}

// Saves the author's changes to a post. Answers null when there is no such post of theirs.
export async function updateRequest(
  userId: string,
  id: string,
  input: Record<string, unknown>,
): Promise<SaveResult | null> {
  if (!ID_PATTERN.test(id)) return null;
  const read = readRequest(input);
  if (!read.ok) return read;
  const v = read.values;

  const [before] = await sql`select image from requests where id = ${id} and user_id = ${userId}`;
  if (!before) return null;
  await sql`
    update requests
    set title = ${v.title}, brand = ${v.brand}, category = ${v.category}, condition = ${v.condition},
        budget = ${v.budget}, city = ${v.city}, phone = ${v.phone}, description = ${v.description}, image = ${v.image}
    where id = ${id} and user_id = ${userId}`;
  // A picture the author replaced or took out is no longer needed.
  if (before.image !== v.image) await discardImage(before.image as string | null);
  return { ok: true, id };
}

// The author's own post with its phone number, for the form that edits it; null for anybody else.
export async function getOwnRequest(userId: string, id: string) {
  if (!ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select r.*, u.username, u.avatar
    from requests r join users u on u.id = r.user_id
    where r.id = ${id} and r.user_id = ${userId}`;
  return row ? { ...toRequest(row), phone: row.phone as string } : null;
}

type RequestQuery = {
  // The signed-in user, whose hearts are marked on the posts.
  viewerId?: string | null;
  // Only this user's own posts.
  authorId?: string | null;
  // Only the posts the viewer marked with the heart.
  favoritesOnly?: boolean;
};

// The "Търся" posts, newest first. The phone numbers are left out: they are given only to
// signed-in users, one post at a time (see getRequestPhone).
export async function getRequests({ viewerId = null, authorId = null, favoritesOnly = false }: RequestQuery = {}) {
  const rows = await sql`
    select r.id, r.user_id, r.title, r.brand, r.category, r.condition, r.budget, r.city, r.description,
           r.image, r.created_at, u.username, u.avatar, f.user_id is not null as favorite
    from requests r
    join users u on u.id = r.user_id
    left join request_favorites f on f.request_id = r.id and f.user_id = ${viewerId}
    where (${authorId}::uuid is null or r.user_id = ${authorId})
      and (not ${favoritesOnly} or f.user_id is not null)
    order by r.created_at desc`;
  return rows.map(toRequest);
}

// The phone number left on a post, or null when there is no such post.
export async function getRequestPhone(id: string) {
  if (!ID_PATTERN.test(id)) return null;
  const [row] = await sql`select phone from requests where id = ${id}`;
  return (row?.phone as string | undefined) ?? null;
}

// Deletes the author's own post. Answers false when there is no such post of theirs.
export async function deleteRequest(userId: string, id: string) {
  if (!ID_PATTERN.test(id)) return false;
  const [removed] = await sql`delete from requests where id = ${id} and user_id = ${userId} returning image`;
  if (!removed) return false;
  await discardImage(removed.image as string | null);
  return true;
}

// Marks the post with the heart for this user, or takes the heart off. Doing either twice changes
// nothing. Returns false when there is no such post.
export async function setRequestFavorite(userId: string, id: string, favorite: boolean) {
  if (!ID_PATTERN.test(id)) return false;
  if (!favorite) {
    await sql`delete from request_favorites where user_id = ${userId} and request_id = ${id}`;
    return true;
  }
  const [post] = await sql`select id from requests where id = ${id}`;
  if (!post) return false;
  await sql`insert into request_favorites (user_id, request_id) values (${userId}, ${id}) on conflict do nothing`;
  return true;
}
