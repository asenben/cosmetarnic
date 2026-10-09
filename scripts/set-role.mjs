// Shows every account's role, or changes one account's role.
//   npm run db:role                      – list the accounts and their roles
//   npm run db:role -- <username> admin  – make the account an administrator
//   npm run db:role -- <username> user   – make it an ordinary user again
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);
const [username, role] = process.argv.slice(2);

if (username) {
  if (role !== "admin" && role !== "user") {
    throw new Error('The role must be "admin" or "user", e.g. npm run db:role -- Maria admin');
  }
  // Usernames are unique regardless of letter case.
  const changed = await sql`update users set role = ${role} where lower(username) = lower(${username}) returning username`;
  console.log(changed.length > 0 ? `${changed[0].username} is now "${role}".` : `There is no account named "${username}".`);
}

const accounts = await sql`select username, email, role from users order by created_at`;
for (const account of accounts) {
  console.log(`${account.role.padEnd(6)} ${account.username}  <${account.email}>`);
}
