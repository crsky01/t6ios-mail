import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    // Use Supabase Pooler (port 6543) for serverless compatibility
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      pool = new Pool({
        host: process.env.DATABASE_HOST || "aws-0-us-east-1.pooler.supabase.com",
        port: parseInt(process.env.DATABASE_PORT || "6543"),
        database: process.env.DATABASE_NAME || "postgres",
        user: process.env.DATABASE_USER || "postgres.inooaqxhjkdezofapayi",
        password: process.env.DATABASE_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });
    }
  }
  return pool;
}
