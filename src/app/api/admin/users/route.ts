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
  const { data } = await sb.from("app_users").select("id,username,is_authorized,is_admin,created_at").order("created_at", { ascending: false });
  return NextResponse.json({ users: data || [] });
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
