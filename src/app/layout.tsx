import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZenBot Pro — Next.js 15 Algorithmic Trading & Backtesting Dashboard",
  description: "Modern turnkey crypto trading bot dashboard, visual backtesting engine, and strategy simulator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
