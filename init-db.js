const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  host: "db.inooaqxhjkdezofapayi.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "op9XoflqRQZIBTfn",
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const sql = fs.readFileSync("supabase-schema.sql", "utf8");
  try {
    await pool.query(sql);
    console.log("✅ Database tables created successfully");
  } catch (err) {
    console.error("Error:", err.message);
  }
  await pool.end();
})();
