// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { verifyToken, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
  if (!token) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "新密码至少4位" }, { status: 400 });
  }

  const sb = getSupabase();
  const { data: dbUser } = await sb.from("app_users").select("password_hash").eq("id", user.userId).single();
  if (!dbUser) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const valid = await verifyPassword(oldPassword, dbUser.password_hash);
  if (!valid) return NextResponse.json({ error: "原密码错误" }, { status: 400 });

  const newHash = await hashPassword(newPassword);
  await sb.from("app_users").update({ password_hash: newHash }).eq("id", user.userId);

  return NextResponse.json({ success: true });
}
