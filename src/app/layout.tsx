import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "T6 邮箱 — 免费临时邮箱",
  description: "无限生成免费邮箱地址，保护您的隐私。",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
