"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "登录失败");
        return;
      }
      if (data.user.isAdmin) router.push("/admin");
      else router.push("/dashboard");
    } catch {
      setError("网络连接错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "注册失败");
        return;
      }
      if (data.user.isAuthorized) router.push("/dashboard");
      else router.push("/pending");
    } catch {
      setError("网络连接错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center min-h-screen px-6 bg-[#f5f5f7]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1d1d1f]">T6 邮箱</h1>
          <p className="text-[15px] text-[#86868b] mt-2">登录或创建新账号</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-[#ff3b30]/5 border border-[#ff3b30]/20 text-[#ff3b30] px-4 py-3 rounded-xl text-[14px]">{error}</div>}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
            className="input-field"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="input-field"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-[16px]">
            {loading ? "..." : "登录"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={handleRegister} disabled={loading} className="text-[14px] text-[#0071e3] hover:underline">
            创建新账号
          </button>
        </div>
      </div>
    </main>
  );
}
