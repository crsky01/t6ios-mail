import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center mx-auto mb-8">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0071e3" strokeWidth="1.5"/>
            <path d="M3 7l9 6.5L21 7" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="text-[40px] sm:text-[48px] font-bold tracking-tight text-[#1d1d1f] leading-[1.1] mb-4">
          Free Temporary Email
        </h1>
        <p className="text-[17px] text-[#86868b] leading-relaxed mb-2 max-w-md mx-auto">
          Generate unlimited email addresses instantly.
        </p>
        <p className="text-[15px] text-[#86868b] mb-10">
          Protect your privacy. No registration spam. All emails @t6ios.com
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/login" className="btn-primary px-8 py-3.5 text-[16px]">
            Get Started
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3.5 text-[16px]">
            Sign In
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-[12px] text-[#86868b] border-t border-[#d2d2d7]/50">
        T6 Mail · t6ios.com
      </footer>
    </main>
  );
}
