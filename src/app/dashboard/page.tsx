"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LatestEmail {
  id: number;
  from_address: string;
  subject: string;
  body_text: string;
  body_html: string;
  created_at: string;
  is_read: boolean;
  mailbox_id: number;
  mailbox_email: string;
}

interface Mailbox {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  unread: number;
  latestEmail: LatestEmail | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [topUnread, setTopUnread] = useState<LatestEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customPrefix, setCustomPrefix] = useState("");

  const fetchMailboxes = useCallback(async () => {
    try {
      const res = await fetch("/api/mailboxes", {headers:{"Authorization":"Bearer "+(localStorage.getItem("auth_token")||"")}});
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      setMailboxes(data.mailboxes || []);
      setTopUnread(data.topUnread || null);
    } catch { /* */ } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchMailboxes(); }, [fetchMailboxes]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchMailboxes(), 10000);
    return () => clearInterval(interval);
  }, [fetchMailboxes]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/mailboxes", { method: "POST" });
      const data = await res.json();
      if (data.mailbox) setMailboxes(prev => [data.mailbox, ...prev]);
    } catch { /* */ } finally { setGenerating(false); }
  }

  async function handleCustomGenerate() {
    if (!customPrefix.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: customPrefix.trim() }),
      });
      const data = await res.json();
      if (data.mailbox) {
        setMailboxes(prev => [data.mailbox, ...prev]);
        setCustomPrefix("");
      }
    } catch { /* */ } finally { setGenerating(false); }
  }

  async function handleDelete(id: number) {
    setMailboxes(prev => prev.filter(m => m.id !== id));
    await fetch(`/api/mailboxes?id=${id}`, { method: "DELETE", headers:{"Authorization":"Bearer "+(localStorage.getItem("auth_token")||"")} });
  }

  function handleCopy(email: string) {
    navigator.clipboard.writeText(email);
  }

  const totalUnread = mailboxes.reduce((sum, mb) => sum + (mb.unread || 0), 0);

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/50 sticky top-0 z-10">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-[#1d1d1f]">T6 邮箱</h1>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-semibold rounded-full bg-[#0071e3] text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => { document.cookie = "token=; Max-Age=0; path=/"; router.push("/login"); }}
            className="text-[14px] text-[#86868b] hover:text-[#1d1d1f]"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 py-8">
        {/* ===== TOP: Latest unread email preview ===== */}
        {topUnread && (
          <div className="mb-6">
            <div className="text-[12px] uppercase tracking-wide text-[#86868b] mb-2 font-medium">
              最新未读邮件
            </div>
            <div className="card overflow-hidden border-[#0071e3]/20 bg-gradient-to-b from-[#0071e3]/3 to-white">
              {/* Email header */}
              <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#0071e3] shrink-0 animate-pulse" />
                  <span className="text-[13px] font-medium text-[#86868b] truncate">
                    收件箱：{topUnread.mailbox_email}
                  </span>
                </div>
                <span className="text-[11px] text-[#86868b] shrink-0 ml-2">
                  {new Date(topUnread.created_at).toLocaleString()}
                </span>
              </div>
              <div className="px-5 pb-1">
                <div className="text-[13px] text-[#86868b]">{topUnread.from_address}</div>
                <h2 className="text-[16px] font-semibold text-[#1d1d1f] mt-0.5">
                  {topUnread.subject}
                </h2>
              </div>
              {/* Email body preview */}
              <div className="px-5 pb-4 pt-2">
                <div className="border-t border-[#d2d2d7]/30 pt-3">
                  {topUnread.body_html ? (
                    <div
                      className="text-[14px] leading-relaxed text-[#1d1d1f] max-h-[200px] overflow-y-auto prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: topUnread.body_html }}
                    />
                  ) : (
                    <pre className="text-[14px] leading-relaxed text-[#1d1d1f] whitespace-pre-wrap font-sans max-h-[200px] overflow-y-auto">
                      {topUnread.body_text || "（无内容）"}
                    </pre>
                  )}
                </div>
              </div>
              {/* Action button */}
              <div className="px-5 pb-4">
                <button
                  onClick={() => router.push(`/inbox/${topUnread.mailbox_id}`)}
                  className="w-full py-2 text-[13px] font-medium rounded-xl bg-[#0071e3] text-white hover:bg-[#0066d6] transition-colors"
                >
                  查看收件箱 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Generate ===== */}
        <div className="card p-6 mb-6">
          <h2 className="text-[17px] font-semibold mb-1">生成邮箱</h2>
          <p className="text-[14px] text-[#86868b] mb-4">随机生成或自定义 @t6ios.com 邮箱地址</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              {generating ? "生成中..." : "+ 随机生成"}
            </button>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomGenerate()}
                placeholder="自定义前缀..."
                className="input-field flex-1"
              />
              <button onClick={handleCustomGenerate} disabled={generating || !customPrefix.trim()} className="btn-secondary whitespace-nowrap">
                @t6ios.com
              </button>
            </div>
          </div>
        </div>

        {/* ===== Mailbox list ===== */}
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
              <div key={mb.id} className="card overflow-hidden">
                {/* Mailbox info row */}
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-mono font-medium text-[#1d1d1f] truncate">{mb.email}</span>
                      {mb.unread > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-semibold rounded-full bg-[#0071e3] text-white shrink-0">
                          {mb.unread}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#86868b]">
                      {new Date(mb.created_at).toLocaleString()} · {mb.is_active ? "可用" : "已停用"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
                {/* Latest unread email preview in card */}
                {mb.latestEmail && (
                  <div className="border-t border-[#d2d2d7]/30 px-4 py-3 bg-[#f5f5f7]/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] shrink-0" />
                      <span className="text-[12px] font-medium text-[#1d1d1f] truncate">
                        {mb.latestEmail.from_address}
                      </span>
                      <span className="text-[11px] text-[#86868b] shrink-0">
                        {new Date(mb.latestEmail.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[13px] text-[#86868b] truncate">{mb.latestEmail.subject}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
