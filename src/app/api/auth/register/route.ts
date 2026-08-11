// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }
    const sb = getSupabase();

    const { data: existing } = await sb.from("app_users").select("id").eq("username", username).limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const { data: users, error } = await sb.from("app_users").insert({
      username,
      password_hash: passwordHash,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // First user gets admin
    const { count } = await sb.from("app_users").select("*", { count: "exact", head: true });
    if (count === 1) {
      await sb.from("app_users").update({ is_admin: true, is_authorized: true }).eq("id", users.id);
      users.is_admin = true;
      users.is_authorized = true;
    }

    const token = signToken({
      userId: users.id,
      username: users.username,
      isAdmin: users.is_admin,
      isAuthorized: users.is_authorized,
    });
    return NextResponse.json({
      success: true,
      token,
      user: { id: users.id, username: users.username, isAdmin: users.is_admin, isAuthorized: users.is_authorized },
      message: users.is_authorized ? "注册成功" : "账号已创建，等待审核"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务器错误" }, { status: 500 });
  }
}
