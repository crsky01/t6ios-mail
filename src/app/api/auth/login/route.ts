import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
  }
  const db = getDb();
  const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }
  const user = result.rows[0];
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }
  const token = signToken({
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    isAuthorized: user.is_authorized,
  });
  const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, isAdmin: user.is_admin, isAuthorized: user.is_authorized } });
  response.cookies.set("token", token, { httpOnly: true, maxAge: 604800, path: "/", sameSite: "lax" });
  return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务器错误" }, { status: 500 });
  }
}
