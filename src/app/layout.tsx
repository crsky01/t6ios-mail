import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "T6 Mail — Free Temporary Email",
  description: "Generate unlimited free email addresses for privacy protection.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
