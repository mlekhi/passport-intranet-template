"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black text-white dark:bg-white dark:text-black"
          aria-hidden="true"
        >
          <span className="text-xs font-bold">▲</span>
        </div>
        <span className="min-w-0 text-sm font-semibold leading-tight">Passport Admin</span>
      </Link>
      <nav aria-label="Primary" className="flex shrink-0 items-center gap-1 text-sm">
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-black/60 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/30"
        >
          Dashboard
        </Link>
        <Link
          href="/deploy"
          aria-current={pathname === "/deploy" ? "page" : undefined}
          className="rounded-md bg-black px-3 py-1.5 font-medium text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:focus-visible:ring-white/50"
        >
          Deploy
        </Link>
      </nav>
    </>
  );
}
