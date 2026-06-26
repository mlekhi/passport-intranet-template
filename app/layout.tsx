import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavLinks } from "./nav-links";
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
          <div className="flex items-center justify-between gap-6 px-6 py-4">
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
