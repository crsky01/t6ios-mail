import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET /api/inbox/[mailboxId] - list emails for a mailbox
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  // Verify user owns this mailbox or is admin
  const mb = await db.query("SELECT * FROM mailboxes WHERE id = $1", [id]);
  if (mb.rows.length === 0) {
    return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
  }
  if (mb.rows[0].user_id !== user.userId && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const emails = await db.query(
    "SELECT * FROM emails WHERE mailbox_id = $1 ORDER BY created_at DESC LIMIT 100",
    [id]
  );
  return NextResponse.json({ mailbox: mb.rows[0], emails: emails.rows });
}

// PATCH - mark email as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { emailId } = await request.json();

  const db = getDb();
  const mb = await db.query("SELECT * FROM mailboxes WHERE id = $1", [id]);
  if (mb.rows.length === 0 || (mb.rows[0].user_id !== user.userId && !user.isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.query("UPDATE emails SET is_read = true WHERE id = $1 AND mailbox_id = $2", [emailId, id]);
  return NextResponse.json({ success: true });
}
