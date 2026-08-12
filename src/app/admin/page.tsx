"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  is_authorized: boolean;
  is_admin: boolean;
  created_at: string;
}

interface AdminEmail {
  id: number;
  from_address: string;
  to_address: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  created_at: string;
  mailbox_id: number;
  mailbox_email: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [topEmail, setTopEmail] = useState<AdminEmail | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users", {headers:{"Authorization":"Bearer "+(localStorage.getItem("auth_token")||"")}})
        .then(r => { if (r.status === 401 || r.status === 403) { router.push("/login"); return null; } return r.json(); }),
      fetch("/api/admin/emails", {headers:{"Authorization":"Bearer "+(localStorage.getItem("auth_token")||"")}})
        .then(r => { if (r.status === 401 || r.status === 403) return null; return r.json(); }),
    ]).then(([userData, emailData]) => {
      if (userData) setUsers(userData.users || []);
      if (emailData) {
        setEmails(emailData.emails || []);
        setTopEmail(emailData.topUnread || null);
        setTotalUnread(emailData.totalUnread || 0);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function toggleAuth(userId: number, authorized: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_authorized: authorized }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_authorized: authorized } : u));
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString();
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/50 sticky top-0 z-10">
        <div className="max-w-[960px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-bold text-[#1d1d1f]">管理面板</h1>
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

      <div className="max-w-[960px] mx-auto px-4 py-8">
        {/* ===== TOP: Latest email preview ===== */}
        <div className="mb-6">
          <div className="text-[12px] uppercase tracking-wide text-[#86868b] mb-2 font-medium">
            最新邮件
          </div>
          <div className="card overflow-hidden border-[#0071e3]/20 bg-gradient-to-b from-[#0071e3]/3 to-white">
            {topEmail ? (
              <>
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {!topEmail.is_read && <div className="w-2 h-2 rounded-full bg-[#0071e3] shrink-0 animate-pulse" />}
                    <span className="text-[13px] font-medium text-[#86868b] truncate">
                      收件箱：{topEmail.mailbox_email}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#86868b] shrink-0 ml-2">
                    {formatTime(topEmail.created_at)}
                  </span>
                </div>
                <div className="px-5 pb-1">
                  <div className="text-[13px] text-[#86868b]">{topEmail.from_address}</div>
                  <h2 className="text-[16px] font-semibold text-[#1d1d1f] mt-0.5">
                    {topEmail.subject}
                  </h2>
                </div>
                <div className="px-5 pb-4 pt-2">
                  <div className="border-t border-[#d2d2d7]/30 pt-3">
                    {topEmail.body_html ? (
                      <div
                        className="text-[14px] leading-relaxed text-[#1d1d1f] max-h-[200px] overflow-y-auto prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: topEmail.body_html }}
                      />
                    ) : (
                      <pre className="text-[14px] leading-relaxed text-[#1d1d1f] whitespace-pre-wrap font-sans max-h-[200px] overflow-y-auto">
                        {topEmail.body_text || "（无内容）"}
                      </pre>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="px-5 py-10 text-center">
                <div className="text-[32px] mb-2 opacity-20">📭</div>
                <p className="text-[14px] text-[#86868b]">暂无邮件</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== User management ===== */}
        <div className="card p-6 mb-6">
          <h2 className="text-[17px] font-semibold mb-1">用户管理</h2>
          <p className="text-[14px] text-[#86868b]">
            {users.length} 个用户 · 授权后可查看收件箱
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#86868b]">加载中...</div>
        ) : (
          <>
            <div className="space-y-2 mb-8">
              {users.map(u => (
                <div key={u.id} className="card flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-medium text-[#1d1d1f]">
                      {u.username}
                      {u.is_admin && <span className="inline-block ml-2 px-2 py-0.5 text-[11px] rounded-full bg-[#34c759]/15 text-[#34c759] font-medium">管理员</span>}
                    </div>
                    <div className="text-[12px] text-[#86868b]">
                      注册于 {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full font-medium ${u.is_authorized ? "bg-[#34c759]/15 text-[#34c759]" : "bg-[#ff9f0a]/15 text-[#ff9f0a]"}`}>
                      {u.is_authorized ? "已授权" : "待审核"}
                    </span>
                    {!u.is_admin && (
                      <button
                        onClick={() => toggleAuth(u.id, !u.is_authorized)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                          u.is_authorized
                            ? "bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/20"
                            : "bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759]/20"
                        }`}
                      >
                        {u.is_authorized ? "撤销" : "授权"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ===== All emails table ===== */}
            <div className="mb-6">
              <div className="text-[12px] uppercase tracking-wide text-[#86868b] mb-2 font-medium">
                所有邮件 · {emails.length} 封
              </div>
            </div>
            {emails.length === 0 ? (
              <div className="text-center py-10 text-[#86868b]">暂无邮件</div>
            ) : (
              <div className="space-y-1">
                {emails.map(email => (
                  <div key={email.id} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                      className="w-full text-left p-3 hover:bg-[#f5f5f7]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {!email.is_read && <div className="w-2 h-2 rounded-full bg-[#0071e3] shrink-0" />}
                        <span className="text-[12px] text-[#86868b] font-mono shrink-0 w-[120px] truncate">
                          {email.mailbox_email}
                        </span>
                        <span className="text-[12px] text-[#86868b] shrink-0 w-[160px] truncate">
                          {email.from_address}
                        </span>
                        <span className="text-[13px] text-[#1d1d1f] flex-1 truncate font-medium">
                          {email.subject}
                        </span>
                        <span className="text-[11px] text-[#86868b] shrink-0">
                          {new Date(email.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </button>
                    {expandedId === email.id && (
                      <div className="border-t border-[#d2d2d7]/30 px-5 py-4 bg-[#f5f5f7]/30">
                        <div className="flex items-center gap-4 mb-3 text-[12px] text-[#86868b]">
                          <span>收件箱：{email.mailbox_email}</span>
                          <span>发件人：{email.from_address}</span>
                          <span>{formatTime(email.created_at)}</span>
                        </div>
                        <div className="border-t border-[#d2d2d7]/20 pt-3">
                          {email.body_html ? (
                            <div
                              className="text-[14px] leading-relaxed text-[#1d1d1f] max-h-[300px] overflow-y-auto prose prose-sm"
                              dangerouslySetInnerHTML={{ __html: email.body_html }}
                            />
                          ) : (
                            <pre className="text-[14px] leading-relaxed text-[#1d1d1f] whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto">
                              {email.body_text || "（无内容）"}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
