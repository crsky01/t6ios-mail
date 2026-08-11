import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || "5432"),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}
