import { getCurrentUser } from "@/lib/auth/session";
import { sql } from "@/lib/db";

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
           (select count(*)::int from requests) as requests`;
  return { users: row.users, listings: row.listings, requests: row.requests };
}
