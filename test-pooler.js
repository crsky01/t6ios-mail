const { Pool } = require("pg");
const pool = new Pool({
  host: "aws-0-us-east-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.inooaqxhjkdezofapayi",
  password: "op9XoflqRQZIBTfn",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
(async () => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    console.log("✅ Pooler works!", r.rows);
  } catch (e) {
    console.log("❌ Pooler failed:", e.message);
  }
  await pool.end();
})();
