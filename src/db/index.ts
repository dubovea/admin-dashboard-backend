import { neon } from "@neondatabase/serverless";
import { drizzle } from 'drizzle-orm/neon-http';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is set in .env file. Please remove it to avoid confusion, as the application uses SQLite.",
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);
