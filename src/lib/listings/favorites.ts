import { sql } from "@/lib/db";
import { getListings, LISTING_ID_PATTERN } from "@/lib/listings";

// The ids of the listings on sale that the user marked with the heart.
export async function getFavoriteIds(userId: string) {
  const rows = await sql`
    select f.listing_id from favorites f join listings l on l.id = f.listing_id
    where f.user_id = ${userId} and l.status = 'active'`;
  return rows.map((row) => row.listing_id as string);
}

// Marks the listing with the heart for this user, or takes the heart off. Doing either twice
// changes nothing. Returns false when there is no such listing.
export async function setFavorite(userId: string, listingId: string, favorite: boolean) {
  if (!LISTING_ID_PATTERN.test(listingId)) return false;
  if (!favorite) {
    await sql`delete from favorites where user_id = ${userId} and listing_id = ${listingId}`;
    return true;
  }
  const [listing] = await sql`select id from listings where id = ${listingId} and status = 'active'`;
  if (!listing) return false;
  await sql`insert into favorites (user_id, listing_id) values (${userId}, ${listingId}) on conflict do nothing`;
  return true;
}

// The user's favourite listings that are still on sale, the one marked last first.
export async function getFavoriteListings(userId: string) {
  const [listings, marked] = await Promise.all([
    getListings(),
    sql`select listing_id from favorites where user_id = ${userId} order by created_at desc`,
  ]);
  const byId = new Map(listings.map((listing) => [listing.id, listing]));
  return marked.flatMap((row) => byId.get(row.listing_id as string) ?? []);
}
