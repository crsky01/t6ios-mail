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
  const { data, error } = await sb.from("mailboxes").select("*").eq("user_id", user.userId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mailboxes: data || [] });
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "t6ios.com";
  const email = `${nanoid(8)}@${domain}`;

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
