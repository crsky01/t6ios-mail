import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { nanoid } from "nanoid";

// Get current user from cookie
async function getUser(request: Request) {
  const { verifyToken } = await import("@/lib/auth");
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  return verifyToken(token);
}

// GET - list my mailboxes
export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const result = await db.query(
    "SELECT * FROM mailboxes WHERE user_id = $1 ORDER BY created_at DESC",
    [user.userId]
  );
  return NextResponse.json({ mailboxes: result.rows });
}

// POST - create new mailbox
export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "t6ios.com";
  const local = nanoid(8);
  const email = `${local}@${domain}`;

  const db = getDb();
  const result = await db.query(
    "INSERT INTO mailboxes (email, user_id) VALUES ($1, $2) RETURNING *",
    [email, user.userId]
  );
  return NextResponse.json({ mailbox: result.rows[0] });
}

// DELETE - delete a mailbox
export async function DELETE(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDb();
  await db.query("DELETE FROM mailboxes WHERE id = $1 AND user_id = $2", [id, user.userId]);
  return NextResponse.json({ success: true });
}
