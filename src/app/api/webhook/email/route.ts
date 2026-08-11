import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Receive emails from MX forward service
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let to = "", from = "", subject = "", bodyText = "", bodyHtml = "";

  if (contentType.includes("application/json")) {
    const json = await request.json();
    to = json.to || "";
    from = json.from || "";
    subject = json.subject || "(no subject)";
    bodyText = json.text || json.body_text || "";
    bodyHtml = json.html || json.body_html || "";
  } else {
    const formData = await request.formData();
    to = formData.get("to") as string;
    from = formData.get("from") as string;
    subject = formData.get("subject") as string;
    bodyText = formData.get("text") as string;
    bodyHtml = formData.get("html") as string;
  }

  if (!to) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
  }

  // Extract email from "Name <email>" format
  const emailMatch = to.match(/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
  const recipientEmail = emailMatch ? emailMatch[1].toLowerCase() : to.toLowerCase();

  const db = getDb();

  // Find mailbox
  const mailbox = await db.query(
    "SELECT id FROM mailboxes WHERE email = $1 AND is_active = true",
    [recipientEmail]
  );

  if (mailbox.rows.length === 0) {
    return NextResponse.json({ received: false, reason: "No active mailbox" }, { status: 200 });
  }

  // Store email
  await db.query(
    `INSERT INTO emails (mailbox_id, from_address, to_address, subject, body_text, body_html)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [mailbox.rows[0].id, from, recipientEmail, subject || "(no subject)", bodyText, bodyHtml]
  );

  return NextResponse.json({ received: true });
}
