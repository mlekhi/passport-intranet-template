import type { Metadata } from "next";
import Link from "next/link";
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
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black">
                <span className="text-xs font-bold">▲</span>
              </div>
              <div className="min-w-0 leading-tight">
                <h1 className="text-sm font-semibold">Passport Admin</h1>
                <p className="truncate text-xs text-black/50 dark:text-white/50">
                  Protection status across all microsites
                </p>
              </div>
            </Link>
            <nav aria-label="Primary" className="flex shrink-0 items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/deploy"
                className="rounded-md bg-black px-3 py-1.5 font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              >
                Deploy
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
