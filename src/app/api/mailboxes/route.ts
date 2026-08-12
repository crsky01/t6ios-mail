// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { nanoid } from "nanoid";
import { verifyToken } from "@/lib/auth";

function getUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const sb = getSupabase();
  const { data: mbs, error } = await sb.from("mailboxes").select("*").eq("user_id", user.userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich each mailbox with unread count + latest unread email
  const mailboxes = await Promise.all((mbs || []).map(async (mb) => {
    const { count } = await sb.from("emails").select("*", { count: "exact", head: true }).eq("mailbox_id", mb.id).eq("is_read", false);
    let latestEmail = null;
    if (count && count > 0) {
      const { data: latest } = await sb.from("emails").select("id,from_address,subject,body_text,created_at,is_read").eq("mailbox_id", mb.id).eq("is_read", false).order("created_at", { ascending: false }).limit(1).single();
      latestEmail = latest;
    }
    return { ...mb, unread: count || 0, latestEmail };
  }));

  // Also get the single most recent unread email across all mailboxes
  let topUnread = null;
  const mailboxIds = (mbs || []).map(m => m.id);
  if (mailboxIds.length > 0) {
    const { data: latest } = await sb.from("emails").select("id,from_address,subject,body_text,body_html,created_at,is_read,mailbox_id").in("mailbox_id", mailboxIds).eq("is_read", false).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (latest) {
      const mb = (mbs || []).find(m => m.id === latest.mailbox_id);
      topUnread = { ...latest, mailbox_email: mb?.email || "" };
    }
  }

  return NextResponse.json({ mailboxes, topUnread });
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const prefix = (body.prefix || "").toLowerCase().replace(/[^a-z0-9._-]/g, "").substring(0, 20);
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "t6ios.com";
  const email = prefix ? `${prefix}@${domain}` : `${nanoid(8)}@${domain}`;

  const sb = getSupabase();
  const { data, error } = await sb.from("mailboxes").insert({ email, user_id: user.userId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mailbox: data });
}

export async function DELETE(request: Request) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  const sb = getSupabase();
  await sb.from("mailboxes").delete().eq("id", id).eq("user_id", user.userId);
  return NextResponse.json({ success: true });
}
