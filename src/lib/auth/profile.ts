import {
  USERNAME_TAKEN,
  checkFullName,
  PHONE_TAKEN,
  checkPhone,
  checkUsername,
  isUniqueViolation,
  samePhone,
  text,
} from "@/lib/auth/accountFields";
import { avatarUrl } from "@/lib/auth/avatar";
import {
  checkProfileLink,
  profileLinks,
  readProfileLinks,
  type ProfileLink,
  type ProfileLinkKey,
  type ProfileLinks,
} from "@/lib/auth/profileLinks";
import { readDeliveries, type Delivery } from "@/lib/listings/delivery";
import { getCities } from "@/lib/options";
import { sql } from "@/lib/db";

export const BIO_MAX = 500;

export type ProfileField = "full_name" | "username" | "phone" | "city" | "delivery" | "bio" | ProfileLinkKey;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export type ProfileDetails = {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  // One of the towns offered in the settings, or "" when none is chosen.
  city: string;
  // The ways the user hands over what they sell, shown on all of their listings.
  delivery: Delivery[];
  // Whether the phone and the town are shown on the user's listings and "Търся" posts.
  show_phone: boolean;
  show_city: boolean;
  bio: string;
  links: ProfileLinks;
  // Whether the counts of listings, sales and favourites are shown on the profile.
  show_stats: boolean;
};

export type UpdateProfileResult = { ok: true; profile: ProfileDetails } | { ok: false; errors: ProfileErrors };

// What the settings page shows. Accounts older than the name and phone fields have them empty.
export async function getProfile(userId: string): Promise<ProfileDetails> {
  const [row] = await sql`
    select username, email, full_name, phone, city, delivery, show_phone, show_city, bio, links, show_stats
    from users where id = ${userId}`;
  return {
    username: row.username,
    email: row.email,
    full_name: row.full_name ?? "",
    phone: row.phone ?? "",
    city: row.city ?? "",
    delivery: readDeliveries(row.delivery),
    show_phone: row.show_phone,
    show_city: row.show_city,
    bio: row.bio ?? "",
    links: readProfileLinks(row.links),
    show_stats: row.show_stats,
  };
}

export type PublicProfile = Pick<ProfileDetails, "username" | "city" | "bio" | "links" | "show_stats"> & {
  id: string;
  // The URL of the profile picture, or null while the account has none.
  avatar: string | null;
  createdAt: Date;
};

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// What anybody may see of an account, for its public page; null when there is no such account.
// A blocked one is there only for an administrator. The name, email and phone stay out of it.
export async function getPublicProfile(userId: string, admin = false): Promise<PublicProfile | null> {
  if (!USER_ID_PATTERN.test(userId)) return null;
  const [row] = await sql`
    select id, username, avatar, created_at, city, bio, links, show_stats from users
    where id = ${userId} and (blocked_at is null or ${admin})`;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    avatar: avatarUrl(row.avatar),
    createdAt: new Date(row.created_at),
    city: row.city ?? "",
    bio: row.bio ?? "",
    links: readProfileLinks(row.links),
    show_stats: row.show_stats,
  };
}

// The email is not changed here: a new address would first have to be confirmed by its owner.
// Nor is the phone number the account was registered with: there is one account per number, and
// only an administrator changes it (see updateUser in src/lib/admin). An account from before the
// phone was asked for adds its number here once.
export async function updateProfile(userId: string, input: Record<string, unknown>): Promise<UpdateProfileResult> {
  const username = checkUsername(input.username);
  const fullName = checkFullName(input.full_name);
  const [stored] = await sql`select phone from users where id = ${userId}`;
  const phone: { value: string; error?: string } = stored?.phone ? { value: stored.phone } : checkPhone(input.phone);
  // Line breaks are kept; only the space around the whole text is dropped.
  const bio = text(input.bio).trim();
  const city = text(input.city).trim();

  const errors: ProfileErrors = {};
  if (username.error) errors.username = username.error;
  if (fullName.error) errors.full_name = fullName.error;
  if (phone.error) errors.phone = phone.error;
  if (bio.length > BIO_MAX) errors.bio = `Текстът трябва да е до ${BIO_MAX} знака.`;
  const cityError = await checkCity(userId, city);
  if (cityError) errors.city = cityError;

  // Only the links that were filled in are stored.
  const typedLinks = typeof input.links === "object" && input.links !== null ? (input.links as Record<string, unknown>) : {};
  const links: Partial<ProfileLinks> = {};
  for (const { key } of profileLinks) {
    const typed = typedLinks[key];
    const entry = typeof typed === "object" && typed !== null ? (typed as Partial<ProfileLink>) : {};
    const link = checkProfileLink(key, entry.url);
    if (link.error) errors[key] = link.error;
    else if (link.value) links[key] = { url: link.value, public: entry.public === true };
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const [taken] = await sql`
    select 1 from users where lower(username) = lower(${username.value}) and id <> ${userId} limit 1
  `;
  if (taken) return { ok: false, errors: { username: USERNAME_TAKEN } };
  if (!stored?.phone) {
    const [used] = await sql`
      select 1 from users
      where regexp_replace(phone, '^([+]|00)359', '0') = ${samePhone(phone.value)} and id <> ${userId} limit 1
    `;
    if (used) return { ok: false, errors: { phone: PHONE_TAKEN } };
  }

  try {
    await sql`
      update users
      set username = ${username.value}, full_name = ${fullName.value}, phone = ${phone.value}, bio = ${bio},
        city = ${city || null}, links = ${JSON.stringify(links)}::jsonb, show_stats = ${input.show_stats === true}
      where id = ${userId}
    `;
  } catch (error) {
    // Someone took the same username in the moment between the check and the update.
    if (isUniqueViolation(error)) return { ok: false, errors: { username: USERNAME_TAKEN } };
    throw error;
  }
  await syncContact(userId);
  return { ok: true, profile: await getProfile(userId) };
}

// A town on the site's list, or the one the profile already has, which may have left the list.
// Answers what is wrong, if anything; an empty town is fine.
async function checkCity(userId: string, city: string) {
  if (!city) return undefined;
  const [current] = await sql`select city from users where id = ${userId}`;
  const offered = (await getCities()).map(({ name }) => name);
  return city !== current?.city && !offered.includes(city) ? "Избери град от списъка." : undefined;
}

export type UpdateContactResult = { ok: true } | { ok: false; errors: ProfileErrors };

// Saves the card on "Моят профил" that every listing and "Търся" post takes its details from: the
// phone and the town, each with whether it is shown, and the ways of handing over. The phone
// follows the same rule as in updateProfile: once the account has one, only an administrator
// changes it.
export async function updateContact(userId: string, input: Record<string, unknown>): Promise<UpdateContactResult> {
  const [stored] = await sql`select phone from users where id = ${userId}`;
  const typedPhone = text(input.phone).trim();
  const phone = stored?.phone ? { value: stored.phone as string } : typedPhone ? checkPhone(typedPhone) : { value: "" };
  const city = text(input.city).trim();
  const delivery = readDeliveries(input.delivery);

  const errors: ProfileErrors = {};
  if ("error" in phone && phone.error) errors.phone = phone.error;
  const cityError = await checkCity(userId, city);
  if (cityError) errors.city = cityError;
  if (delivery.length === 0) errors.delivery = "Избери поне един начин на изпращане.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  if (!stored?.phone && phone.value) {
    const [used] = await sql`
      select 1 from users
      where regexp_replace(phone, '^([+]|00)359', '0') = ${samePhone(phone.value)} and id <> ${userId} limit 1`;
    if (used) return { ok: false, errors: { phone: PHONE_TAKEN } };
  }

  await sql`
    update users
    set phone = ${phone.value || null}, city = ${city || null}, delivery = ${delivery}::text[],
        show_phone = ${input.show_phone === true}, show_city = ${input.show_city === true}
    where id = ${userId}`;
  await syncContact(userId);
  return { ok: true };
}

// The phone, the town and the ways of handing over are set once in the profile. A new listing or
// "Търся" post takes them from there (see contactFor), and every change is copied onto all the
// user's listings and posts. A phone or town the user chose to hide is left empty on them, so it is
// shown nowhere; anything not set in the profile leaves what the listing already has.
export async function syncContact(userId: string) {
  await sql`
    update listings l
    set phone = case when u.show_phone then coalesce(u.phone, l.phone) else '' end,
        city = case when u.show_city then coalesce(nullif(u.city, ''), l.city) else '' end,
        delivery = case when cardinality(u.delivery) > 0 then u.delivery else l.delivery end
    from users u where u.id = l.user_id and u.id = ${userId}`;
  await sql`
    update requests r
    set phone = case when u.show_phone then coalesce(u.phone, r.phone) else '' end,
        city = case when u.show_city then coalesce(nullif(u.city, ''), r.city) else '' end
    from users u where u.id = r.user_id and u.id = ${userId}`;
}

export type Contact = { phone: string; city: string; delivery: Delivery[] };

// What a new listing or post is published with, from the user's profile: the phone and the town
// only when the user chose to show them.
export async function contactFor(userId: string): Promise<Contact> {
  const { phone, city, delivery, show_phone, show_city } = await getProfile(userId);
  return { phone: show_phone ? phone : "", city: show_city ? city : "", delivery };
}

// What a seller still has to set on "Моят профил" before publishing a listing, or undefined when
// nothing is missing. The phone and the town are optional: buyers can always write a message.
export function missingForListing({ delivery }: Contact) {
  return delivery.length === 0 ? "Избери как изпращаш в „Моят профил“." : undefined;
}
