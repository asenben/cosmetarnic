import { USERNAME_TAKEN, checkPhone, checkUsername, isUniqueViolation, text } from "@/lib/auth/accountFields";
import { avatarKey } from "@/lib/auth/avatar";
import { BIO_MAX } from "@/lib/auth/profile";
import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";
import { listingImageKey } from "@/lib/listings/images";
import { deleteImage } from "@/lib/storage/deleteImage";

// The signed-in user when they are an administrator, otherwise null. Every admin page and every
// admin API route asks this first; the role is read from the database with the session.
export async function getAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

// How many rows the sections that list stored things have, by the section's slug. Sections whose
// data is not stored yet have no count.
export async function getAdminCounts(): Promise<Record<string, number>> {
  const [row] = await sql`
    select (select count(*)::int from users) as users,
           (select count(*)::int from listings) as listings,
           (select count(*)::int from requests) as requests,
           (select count(*)::int from categories) as categories,
           (select count(*)::int from conversations c
            where exists (select 1 from messages where conversation_id = c.id)) as messages,
           -- Only the reports still waiting to be looked at.
           (select count(*)::int from reports where status = 'open') as reviews`;
  return {
    users: row.users,
    listings: row.listings,
    requests: row.requests,
    categories: row.categories,
    messages: row.messages,
    reviews: row.reviews,
  };
}

// An account as the administrator's list shows it.
export type AdminUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  role: string;
  avatar: string | null;
  bio: string;
  verified: boolean;
  // Blocked accounts cannot sign in, and what they published is hidden.
  blocked: boolean;
  createdAt: Date;
  listings: number;
  requests: number;
};

const toAdminUser = (row: Record<string, unknown>): AdminUser => ({
  id: row.id as string,
  username: row.username as string,
  email: row.email as string,
  fullName: (row.full_name as string | null) ?? "",
  phone: (row.phone as string | null) ?? "",
  city: (row.city as string | null) ?? "",
  role: row.role as string,
  avatar: row.avatar as string | null,
  bio: (row.bio as string | null) ?? "",
  verified: row.email_verified_at !== null,
  blocked: row.blocked_at !== null,
  createdAt: new Date(row.created_at as string),
  listings: row.listings as number,
  requests: row.requests as number,
});

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every account with how much it has published, the newest account first.
export async function listUsers() {
  const rows = await sql`
    select u.*, (select count(*)::int from listings where user_id = u.id) as listings,
           (select count(*)::int from requests where user_id = u.id) as requests
    from users u order by u.created_at desc`;
  return rows.map(toAdminUser);
}

// One account for its page in the panel, or null when there is none.
export async function getUser(id: string) {
  if (!ID_PATTERN.test(id)) return null;
  const [row] = await sql`
    select u.*, (select count(*)::int from listings where user_id = u.id) as listings,
           (select count(*)::int from requests where user_id = u.id) as requests
    from users u where u.id = ${id}`;
  return row ? toAdminUser(row) : null;
}

// A listing as the administrator's list shows it.
export type AdminListing = {
  id: string;
  number: number;
  title: string;
  brand: string;
  price: number;
  city: string;
  image: string | null;
  createdAt: Date;
  views: number;
  seller: { id: string; username: string };
};

// Every listing of every seller, or only one seller's, the newest first.
export async function listListings(sellerId: string | null = null): Promise<AdminListing[]> {
  const rows = await sql`
    select l.id, l.number, l.title, l.brand, l.price, l.city, l.images, l.created_at, l.user_id, u.username,
           (select count(*)::int from listing_views where listing_id = l.id) as views
    from listings l join users u on u.id = l.user_id
    where ${sellerId}::uuid is null or l.user_id = ${sellerId}
    order by l.created_at desc`;
  return rows.map((row) => ({
    id: row.id,
    number: Number(row.number),
    title: row.title,
    brand: row.brand,
    price: Number(row.price),
    city: row.city,
    image: (row.images as string[])[0] ?? null,
    createdAt: new Date(row.created_at),
    views: row.views,
    seller: { id: row.user_id, username: row.username },
  }));
}

type FieldErrors = Record<string, string>;
export type ManageResult = { ok: true } | { ok: false; message: string; errors?: FieldErrors };

const NOT_FOUND: ManageResult = { ok: false, message: "Профилът не е намерен." };
// An administrator cannot lock themselves out of the panel by mistake.
const OWN_ACCOUNT: ManageResult = { ok: false, message: "Това не може да се направи със собствения ти профил." };

// Saves the administrator's changes to an account's details. Unlike the owner's own settings,
// the name and the phone may be left empty here.
export async function updateUser(id: string, input: Record<string, unknown>): Promise<ManageResult> {
  if (!ID_PATTERN.test(id)) return NOT_FOUND;
  const username = checkUsername(input.username);
  const fullName = text(input.full_name).trim().replace(/\s+/g, " ").slice(0, 80);
  const typedPhone = text(input.phone).trim();
  const phone = typedPhone ? checkPhone(typedPhone) : { value: "" };
  const city = text(input.city).trim().slice(0, 60);
  const bio = text(input.bio).trim();

  const errors: FieldErrors = {};
  if (username.error) errors.username = username.error;
  if ("error" in phone && phone.error) errors.phone = phone.error;
  if (bio.length > BIO_MAX) errors.bio = `Текстът трябва да е до ${BIO_MAX} знака.`;
  if (Object.keys(errors).length > 0) return { ok: false, message: "Провери отбелязаните полета.", errors };

  try {
    const changed = await sql`
      update users
      set username = ${username.value}, full_name = ${fullName || null}, phone = ${phone.value || null},
          city = ${city || null}, bio = ${bio || null}
      where id = ${id} returning id`;
    return changed.length > 0 ? { ok: true } : NOT_FOUND;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, message: "Провери отбелязаните полета.", errors: { username: USERNAME_TAKEN } };
    }
    throw error;
  }
}

// Blocks an account or lifts the block. Blocking signs the account out everywhere at once.
export async function setUserBlocked(adminId: string, id: string, blocked: boolean): Promise<ManageResult> {
  if (!ID_PATTERN.test(id)) return NOT_FOUND;
  if (id === adminId) return OWN_ACCOUNT;
  const changed = await sql`
    update users set blocked_at = ${blocked ? new Date().toISOString() : null} where id = ${id} returning id`;
  if (changed.length === 0) return NOT_FOUND;
  if (blocked) await sql`delete from sessions where user_id = ${id}`;
  return { ok: true };
}

// Makes an account an administrator, or an ordinary user again.
export async function setUserRole(adminId: string, id: string, role: unknown): Promise<ManageResult> {
  if (!ID_PATTERN.test(id)) return NOT_FOUND;
  if (role !== "admin" && role !== "user") return { ok: false, message: "Невалидна роля." };
  if (id === adminId) return OWN_ACCOUNT;
  const changed = await sql`update users set role = ${role} where id = ${id} returning id`;
  return changed.length > 0 ? { ok: true } : NOT_FOUND;
}

// Deletes an account for good, with everything it published, its messages and its pictures.
export async function deleteUser(adminId: string, id: string): Promise<ManageResult> {
  if (!ID_PATTERN.test(id)) return NOT_FOUND;
  if (id === adminId) return OWN_ACCOUNT;

  // The pictures are gathered first: the rows that name them go with the account.
  const [user] = await sql`select avatar from users where id = ${id}`;
  if (!user) return NOT_FOUND;
  const listings = await sql`select images from listings where user_id = ${id}`;
  const requests = await sql`select image from requests where user_id = ${id} and image is not null`;
  const keys = [
    ...(user.avatar ? [avatarKey(user.avatar)] : []),
    ...listings.flatMap((row) => (row.images as string[]).map(listingImageKey)),
    ...requests.map((row) => listingImageKey(row.image)),
  ];

  await sql`delete from users where id = ${id}`;
  // A leftover file is harmless, so a failure here is only logged.
  for (const key of keys) {
    try {
      await deleteImage(key);
    } catch (error) {
      console.error("Picture of a deleted account could not be removed", error);
    }
  }
  return { ok: true };
}
