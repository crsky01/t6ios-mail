// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user?.isAdmin) return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const sb = getSupabase();

  // Get all emails across all mailboxes, newest first
  const { data: emails, error } = await sb.from("emails").select(`
    id,from_address,to_address,subject,body_text,body_html,is_read,created_at,
    mailbox_id,
    mailboxes!inner(email)
  `).order("created_at", { ascending: false }).limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with mailbox email
  const enriched = (emails || []).map((e: any) => ({
    ...e,
    mailbox_email: e.mailboxes?.email || "",
    mailboxes: undefined,
  }));

  // Stats
  const totalUnread = enriched.filter((e: any) => !e.is_read).length;

  // Top unread across all mailboxes
  const topUnread = enriched.find((e: any) => !e.is_read) || enriched[0] || null;

  return NextResponse.json({ emails: enriched, totalUnread, topUnread });
}
