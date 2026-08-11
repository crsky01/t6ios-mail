import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  return verifyToken(token);
}

// GET - list all users (admin only)
export async function GET(request: Request) {
  const user = getUser(request);
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  const result = await db.query(
    "SELECT id, username, is_authorized, is_admin, created_at FROM users ORDER BY created_at DESC"
  );
  return NextResponse.json({ users: result.rows });
}

// PATCH - toggle user authorization
export async function PATCH(request: Request) {
  const user = getUser(request);
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, is_authorized } = await request.json();
  if (typeof userId === "undefined" || typeof is_authorized === "undefined") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  await db.query("UPDATE users SET is_authorized = $1 WHERE id = $2", [is_authorized, userId]);
  return NextResponse.json({ success: true });
}
