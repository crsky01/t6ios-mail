"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

interface Email {
  id: number;
  from_address: string;
  to_address: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  created_at: string;
}

interface MailboxData {
  id: number;
  email: string;
  is_active: boolean;
}

export default function InboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [mailbox, setMailbox] = useState<MailboxData | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, set加载中... useState(true);

  useEffect(() => {
    fetch(`/api/inbox/${id}`)
      .then(r => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then(data => {
        if (data) {
          setMailbox(data.mailbox);
          setEmails(data.emails || []);
        }
      })
      .catch(() => {})
      .finally(() => set加载中...lse));
  }, [id, router]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/inbox/${id}`)
        .then(r => r.json())
        .then(data => { if (data.emails) setEmails(data.emails); })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function markRead(emailId: number) {
    await fetch(`/api/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId }),
    });
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/50 sticky top-0 z-10">
        <div className="max-w-[720px] mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="text-[15px] text-[#86868b] hover:text-[#1d1d1f]">
            ← 返回
          </button>
          <h1 className="text-[17px] font-semibold text-[#1d1d1f] truncate max-w-[300px]">
            {mailbox?.email || "收件箱"}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 py-6">
        {mailbox && (
          <div className="card mb-4 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-mono font-medium">{mailbox.email}</div>
              <div className="text-[12px] text-[#86868b]">{emails.length} 封邮件</div>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(mailbox.email); }}
              className="text-[13px] px-4 py-1.5 rounded-full bg-[#f5f5f7] text-[#0071e3]"
            >
              Copy
            </button>
          </div>
        )}

        {selected ? (
          <div className="card p-5 animate-in">
            <button onClick={() => setSelected(null)} className="text-[14px] text-[#86868b] hover:text-[#1d1d1f] mb-4">
              ← 返回 to list
            </button>
            <div className="text-[11px] text-[#86868b] mb-1">{selected.from_address}</div>
            <h2 className="text-[17px] font-semibold mb-1">{selected.subject}</h2>
            <div className="text-[12px] text-[#86868b] mb-4">{new Date(selected.created_at).toLocaleString()}</div>
            <div className="border-t border-[#d2d2d7]/50 pt-4">
              {selected.body_html ? (
                <div className="prose text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
              ) : (
                <pre className="text-[15px] leading-relaxed whitespace-pre-wrap font-sans text-[#1d1d1f]">
                  {selected.body_text || "（无内容）"}
                </pre>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-[#86868b]">加载中...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[40px] mb-3 opacity-30">📭</div>
            <p className="text-[15px] text-[#86868b]">收件箱为空</p>
            <p className="text-[13px] text-[#86868b] mt-1">
              等待邮件发送到 {mailbox?.email}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map(email => (
              <button
                key={email.id}
                onClick={() => { markRead(email.id); setSelected(email); }}
                className="card w-full text-left hover:border-[#0071e3]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {!email.is_read && <div className="w-2 h-2 rounded-full bg-[#0071e3] shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className={`text-[14px] truncate ${!email.is_read ? "font-semibold" : ""}`}>
                      {email.from_address}
                    </div>
                    <div className="text-[13px] text-[#86868b] truncate">{email.subject}</div>
                  </div>
                  <div className="text-[11px] text-[#86868b] shrink-0">
                    {new Date(email.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
