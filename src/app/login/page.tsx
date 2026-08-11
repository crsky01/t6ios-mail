"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;
    if (!username || !password) { setError("请输入用户名和密码"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.user.isAdmin ? "/admin" : "/dashboard");
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络连接错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (loading) return;
    if (!username || !password) { setError("请输入用户名和密码"); return; }
    if (password.length < 6) { setError("密码至少6位"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(data.user.isAuthorized ? "/dashboard" : "/pending");
      } else {
        setError(data.error || "注册失败");
      }
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
        <div className="space-y-4">
          {error && <div className="bg-[#ff3b30]/5 border border-[#ff3b30]/20 text-[#ff3b30] px-4 py-3 rounded-xl text-[14px]">{error}</div>}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="用户名"
            className="input-field"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="密码"
            className="input-field"
          />
          <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3.5 text-[16px]">
            {loading ? "..." : "登录"}
          </button>
        </div>
        <div className="mt-4 text-center">
          <button onClick={handleRegister} disabled={loading} className="text-[14px] text-[#0071e3] hover:underline">
            创建新账号
          </button>
        </div>
      </div>
    </main>
  );
}
