// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { verifyToken, hashPassword } from "@/lib/auth";

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
  const { data } = await sb.from("app_users").select("id,username,is_authorized,is_admin,created_at").order("created_at", { ascending: false });
  return NextResponse.json({ users: data || [] });
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user?.isAdmin) return NextResponse.json({ error: "无权操作" }, { status: 403 });

  const { username, password } = await request.json();
  if (!username || !password) return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
  if (password.length < 4) return NextResponse.json({ error: "密码至少4位" }, { status: 400 });

  const sb = getSupabase();
  // Check if username exists
  const { data: existing } = await sb.from("app_users").select("id").eq("username", username).maybeSingle();
  if (existing) return NextResponse.json({ error: "用户名已存在" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const { data: created, error } = await sb.from("app_users").insert({
    username, password_hash: passwordHash, is_authorized: true, is_admin: false,
  }).select("id,username,is_authorized,is_admin,created_at").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: created });
}

export async function PATCH(request: Request) {
  const user = getUser(request);
  if (!user?.isAdmin) return NextResponse.json({ error: "无权操作" }, { status: 403 });

  const { userId, is_authorized } = await request.json();
  if (typeof userId === "undefined") return NextResponse.json({ error: "缺少参数" }, { status: 400 });

  const sb = getSupabase();
  await sb.from("app_users").update({ is_authorized }).eq("id", userId);
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const adminUser = getUser(request);
  if (!adminUser?.isAdmin) return NextResponse.json({ error: "无权操作" }, { status: 403 });

  const { userId, newPassword } = await request.json();
  if (!userId || !newPassword) return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  if (newPassword.length < 4) return NextResponse.json({ error: "密码至少4位" }, { status: 400 });

  const sb = getSupabase();
  const passwordHash = await hashPassword(newPassword);
  await sb.from("app_users").update({ password_hash: passwordHash }).eq("id", userId);
  return NextResponse.json({ success: true });
}
