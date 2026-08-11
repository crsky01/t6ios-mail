// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const sb = getSupabase();

  const { data: mailbox } = await sb.from("mailboxes").select("*").eq("id", id).single();
  if (!mailbox) return NextResponse.json({ error: "邮箱不存在" }, { status: 404 });
  if (mailbox.user_id !== user.userId && !user.isAdmin) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const { data: emails } = await sb.from("emails").select("*").eq("mailbox_id", id).order("created_at", { ascending: false }).limit(100);
  return NextResponse.json({ mailbox, emails: emails || [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const { emailId } = await request.json();
  const sb = getSupabase();

  const { data: mailbox } = await sb.from("mailboxes").select("*").eq("id", id).single();
  if (!mailbox || (mailbox.user_id !== user.userId && !user.isAdmin)) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  await sb.from("emails").update({ is_read: true }).eq("id", emailId).eq("mailbox_id", id);
  return NextResponse.json({ success: true });
}
