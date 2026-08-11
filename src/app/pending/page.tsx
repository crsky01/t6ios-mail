import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen px-6 bg-[#f5f5f7]">
      <div className="text-center max-w-[400px]">
        <div className="text-[48px] mb-4">⏳</div>
        <h1 className="text-[24px] font-bold text-[#1d1d1f] mb-2">等待管理员审核</h1>
        <p className="text-[15px] text-[#86868b] mb-6">
          您的账号已创建，需要管理员授权后才能使用相关功能。
        </p>
        <Link href="/login" className="btn-primary">返回登录</Link>
      </div>
    </main>
  );
}
