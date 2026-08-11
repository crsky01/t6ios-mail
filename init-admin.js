const { Pool } = require("pg");
const pool = new Pool({
  host: "db.inooaqxhjkdezofapayi.supabase.co",
  port: 5432, database: "postgres", user: "postgres",
  password: "op9XoflqRQZIBTfn", ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    // Create admin user with bcrypt hash for "admin123"
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("admin123", 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, is_authorized, is_admin) VALUES ($1, $2, true, true) ON CONFLICT (username) DO NOTHING RETURNING id",
      ["admin", hash]
    );
    if (result.rows.length > 0) {
      console.log("Admin user created: admin / admin123");
    } else {
      console.log("Admin user already exists");
    }
    await pool.end();
    console.log("✅ Database setup complete");
  } catch (err) {
    console.error("Error:", err.message);
    await pool.end();
  }
})();
