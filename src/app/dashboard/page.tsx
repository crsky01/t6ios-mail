"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Mailbox {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchMailboxes = useCallback(async () => {
    try {
      const res = await fetch("/api/mailboxes");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setMailboxes(data.mailboxes || []);
    } catch { /* */ } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchMailboxes(); }, [fetchMailboxes]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/mailboxes", { method: "POST" });
      const data = await res.json();
      if (data.mailbox) setMailboxes(prev => [data.mailbox, ...prev]);
    } catch { /* */ } finally { setGenerating(false); }
  }

  async function handleDelete(id: number) {
    setMailboxes(prev => prev.filter(m => m.id !== id));
    await fetch(`/api/mailboxes?id=${id}`, { method: "DELETE" });
  }

  function handleCopy(email: string) {
    navigator.clipboard.writeText(email);
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/50 sticky top-0 z-10">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-[#1d1d1f]">T6 邮箱</h1>
          <button
            onClick={() => { document.cookie = "token=; Max-Age=0; path=/"; router.push("/login"); }}
            className="text-[14px] text-[#86868b] hover:text-[#1d1d1f]"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 py-8">
        {/* Generate */}
        <div className="card p-6 mb-6">
          <h2 className="text-[17px] font-semibold mb-1">生成邮箱</h2>
          <p className="text-[14px] text-[#86868b] mb-4">点击创建新的 @t6ios.com 邮箱地址</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? "生成中..." : "+ 生成新邮箱"}
          </button>
        </div>

        {/* Mailbox list */}
        {loading ? (
          <div className="text-center py-10 text-[#86868b]">加载中...</div>
        ) : mailboxes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[40px] mb-3 opacity-30">📧</div>
            <p className="text-[15px] text-[#86868b]">还没有邮箱地址</p>
            <p className="text-[13px] text-[#86868b]">点击上方按钮生成第一个</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mailboxes.map(mb => (
              <div key={mb.id} className="card flex items-center justify-between animate-in">
                <div>
                  <div className="text-[15px] font-mono font-medium text-[#1d1d1f]">{mb.email}</div>
                  <div className="text-[12px] text-[#86868b]">
                    {new Date(mb.created_at).toLocaleString()} · {mb.is_active ? "可用" : "已停用"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCopy(mb.email)} className="px-3 py-1.5 text-[12px] rounded-full bg-[#f5f5f7] text-[#0071e3] hover:bg-[#e8e8ed]">
                    Copy
                  </button>
                  <button onClick={() => router.push(`/inbox/${mb.id}`)} className="px-3 py-1.5 text-[12px] rounded-full bg-[#0071e3] text-white hover:bg-[#0066d6]">
                    收件箱 →
                  </button>
                  <button onClick={() => handleDelete(mb.id)} className="px-3 py-1.5 text-[12px] rounded-full text-[#ff3b30] hover:bg-[#ff3b30]/5">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
