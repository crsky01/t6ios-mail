import { Pool } from "pg";

let pool: Pool | null = null;

// Supabase Pooler connection (port 6543) — works from Vercel serverless
const POOLER_HOST = "db.inooaqxhjkdezofapayi.supabase.co";
const POOLER_PORT = 6543;
const DB_NAME = "postgres";
const DB_USER = "postgres";

export function getDb(): Pool {
  if (!pool) {
    // Use DATABASE_URL if provided, otherwise use pooler with password from env
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    } else {
      pool = new Pool({
        host: POOLER_HOST,
        port: POOLER_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: process.env.DATABASE_PASSWORD || "",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
    }
  }
  return pool;
}
