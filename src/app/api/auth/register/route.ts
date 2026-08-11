import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  const db = getDb();

  // Check if user exists
  const existing = await db.query("SELECT id FROM users WHERE username = $1", [username]);
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const result = await db.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, is_authorized, is_admin",
    [username, passwordHash]
  );
  const user = result.rows[0];

  // If this is the first user, make them admin
  const count = await db.query("SELECT COUNT(*) FROM users");
  if (parseInt(count.rows[0].count) === 1) {
    await db.query("UPDATE users SET is_admin = true, is_authorized = true WHERE id = $1", [user.id]);
    user.is_admin = true;
    user.is_authorized = true;
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    isAuthorized: user.is_authorized,
  });
  const response = NextResponse.json({
    success: true,
    user: { id: user.id, username: user.username, isAdmin: user.is_admin, isAuthorized: user.is_authorized },
    message: user.is_authorized ? "Account created" : "Account created. Waiting for admin approval."
  });
  response.cookies.set("token", token, { httpOnly: true, maxAge: 604800, path: "/", sameSite: "lax" });
  return response;
}
