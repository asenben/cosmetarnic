// Creates the database tables from src/lib/db/schema.ts. Run with `npm run db:migrate`.
import { neon } from "@neondatabase/serverless";
import { schema } from "../src/lib/db/schema.ts";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

for (const statement of schema) {
  await sql.query(statement);
  console.log(`ok: ${statement.trim().split("\n")[0]}`);
}
