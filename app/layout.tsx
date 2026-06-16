import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Passport Admin",
  description: "Central dashboard for Passport-protected microsites.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black">
              <span className="text-xs font-bold">▲</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">Passport Admin</h1>
              <p className="text-xs text-black/50 dark:text-white/50">
                Protection status across all microsites
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
