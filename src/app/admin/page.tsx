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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => { if (r.status === 401 || r.status === 403) { router.push("/login"); return null; } return r.json(); })
      .then(data => { if (data) setUsers(data.users || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function toggleAuth(userId: number, authorized: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, is_authorized: authorized }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_authorized: authorized } : u));
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/50 sticky top-0 z-10">
        <div className="max-w-[900px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-[20px] font-bold text-[#1d1d1f]">Admin Panel</h1>
          <button
            onClick={() => { document.cookie = "token=; Max-Age=0; path=/"; router.push("/login"); }}
            className="text-[14px] text-[#86868b] hover:text-[#1d1d1f]"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-4 py-8">
        <div className="card p-6 mb-6">
          <h2 className="text-[17px] font-semibold mb-1">User Management</h2>
          <p className="text-[14px] text-[#86868b]">Authorize users to view email inboxes</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#86868b]">Loading...</div>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="card flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-medium text-[#1d1d1f]">
                    {u.username}
                    {u.is_admin && <span className="tag tag-green ml-2">Admin</span>}
                  </div>
                  <div className="text-[12px] text-[#86868b]">
                    Joined {new Date(u.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`tag ${u.is_authorized ? "tag-green" : "tag-yellow"}`}>
                    {u.is_authorized ? "Authorized" : "Pending"}
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
                      {u.is_authorized ? "Revoke" : "Authorize"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
