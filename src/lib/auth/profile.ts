import {
  USERNAME_TAKEN,
  checkFullName,
  checkPhone,
  checkUsername,
  isUniqueViolation,
  text,
} from "@/lib/auth/accountFields";
import {
  checkProfileLink,
  profileLinks,
  readProfileLinks,
  type ProfileLink,
  type ProfileLinkKey,
  type ProfileLinks,
} from "@/lib/auth/profileLinks";
import { cities } from "@/data/listingOptions";
import { sql } from "@/lib/db";

export const BIO_MAX = 500;

export type ProfileField = "full_name" | "username" | "phone" | "city" | "bio" | ProfileLinkKey;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export type ProfileDetails = {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  // One of the towns offered in the settings, or "" when none is chosen.
  city: string;
  bio: string;
  links: ProfileLinks;
  // Whether the counts of listings, sales and favourites are shown on the profile.
  show_stats: boolean;
};

export type UpdateProfileResult = { ok: true; profile: ProfileDetails } | { ok: false; errors: ProfileErrors };

// What the settings page shows. Accounts older than the name and phone fields have them empty.
export async function getProfile(userId: string): Promise<ProfileDetails> {
  const [row] = await sql`select username, email, full_name, phone, city, bio, links, show_stats from users where id = ${userId}`;
  return {
    username: row.username,
    email: row.email,
    full_name: row.full_name ?? "",
    phone: row.phone ?? "",
    city: row.city ?? "",
    bio: row.bio ?? "",
    links: readProfileLinks(row.links),
    show_stats: row.show_stats,
  };
}

// The email is not changed here: a new address would first have to be confirmed by its owner.
export async function updateProfile(userId: string, input: Record<string, unknown>): Promise<UpdateProfileResult> {
  const username = checkUsername(input.username);
  const fullName = checkFullName(input.full_name);
  const phone = checkPhone(input.phone);
  // Line breaks are kept; only the space around the whole text is dropped.
  const bio = text(input.bio).trim();
  const city = text(input.city).trim();

  const errors: ProfileErrors = {};
  if (username.error) errors.username = username.error;
  if (fullName.error) errors.full_name = fullName.error;
  if (phone.error) errors.phone = phone.error;
  if (bio.length > BIO_MAX) errors.bio = `Текстът трябва да е до ${BIO_MAX} знака.`;
  if (city && !cities.includes(city)) errors.city = "Избери град от списъка.";

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
  return { ok: true, profile: await getProfile(userId) };
}
