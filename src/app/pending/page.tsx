import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen px-6 bg-[#f5f5f7]">
      <div className="text-center max-w-[400px]">
        <div className="text-[48px] mb-4">⏳</div>
        <h1 className="text-[24px] font-bold text-[#1d1d1f] mb-2">Waiting for Approval</h1>
        <p className="text-[15px] text-[#86868b] mb-6">
          Your account has been created but needs admin authorization before you can access the dashboard.
        </p>
        <Link href="/login" className="btn-primary">Back to Login</Link>
      </div>
    </main>
  );
}
