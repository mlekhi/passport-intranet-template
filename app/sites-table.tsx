"use client";

import { useMemo, useState } from "react";
import type { ProtectionStatus } from "@/lib/vercel";

type StatusFilter = "all" | "protected" | "unprotected";

export function SitesTable({ sites }: { sites: ProtectionStatus[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((s) => {
      if (status === "protected" && !s.protected) return false;
      if (status === "unprotected" && s.protected) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.url ?? "").toLowerCase().includes(q) ||
        (s.connectorName ?? "").toLowerCase().includes(q)
      );
    });
  }, [sites, query, status]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="sites-search" className="sr-only">
          Search microsites
        </label>
        <div className="relative flex-1 min-w-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="sites-search"
            type="search"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search microsites…"
            className="h-10 w-full rounded-lg border border-black/15 bg-transparent pl-9 pr-4 text-sm placeholder:text-black/40 focus:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:placeholder:text-white/40 dark:focus:border-white/30 dark:focus-visible:ring-white/20"
          />
        </div>
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="Filter by protection status"
            className="h-10 appearance-none rounded-lg border border-black/15 bg-transparent pl-4 pr-9 text-sm focus:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:focus:border-white/30 dark:focus-visible:ring-white/20"
          >
            <option value="all">All</option>
            <option value="protected">Protected</option>
            <option value="unprotected">Unprotected</option>
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full table-fixed text-sm" aria-label="Microsites protection status">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[26%]" />
            <col className="w-[13%]" />
            <col className="w-[17%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/50 dark:border-white/10 dark:text-white/50">
              <Th>Microsite</Th>
              <Th>URL</Th>
              <Th>Passport</Th>
              <Th>Connector</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-black/45 dark:text-white/45">
                  No microsites match.
                </td>
              </tr>
            ) : (
              filtered.map((site) => (
                <tr
                  key={site.projectId}
                  className="border-b border-black/5 last:border-0 hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.03]"
                >
                  <Td>
                    <div className="font-medium">{site.name}</div>
                    <div className="mt-0.5"><FrameworkBadge framework={site.framework} /></div>
                  </Td>
                  <Td>
                    {site.url ? (
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-black/70 hover:text-black dark:text-white/60 dark:hover:text-white"
                      >
                        {site.url.replace(/^https?:\/\//, "")}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ml-1 inline-block opacity-50 align-middle">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <Dash />
                    )}
                  </Td>
                  <Td>
                    <ProtectionBadge protectedSite={site.protected} />
                  </Td>
                  <Td>
                    {site.connectorId ? (
                      <div className="group/conn flex items-start gap-1.5">
                        <div className="min-w-0">
                          {site.connectorName ? (
                            <>
                              <div className="text-xs font-medium">{site.connectorName}</div>
                              {site.connectorIdp ? (
                                <div className="font-mono text-[11px] text-black/45 dark:text-white/45">
                                  {site.connectorIdp}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <span title={site.connectorId} className="font-mono text-[11px] text-black/55 dark:text-white/55">
                              {site.connectorId.slice(0, 14)}…
                            </span>
                          )}
                        </div>
                        <CopyButton value={site.connectorId} />
                      </div>
                    ) : (
                      <Dash />
                    )}
                  </Td>
                  <Td>
                    <DeployState state={site.lastDeploymentState} />
                  </Td>
                  <Td>
                    <span className="text-xs text-black/55 dark:text-white/55">{formatDate(site.updatedAt)}</span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function ProtectionBadge({ protectedSite }: { protectedSite: boolean }) {
  if (!protectedSite) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unprotected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Protected
    </span>
  );
}

function DeployState({ state }: { state?: string }) {
  if (!state) return <Dash />;
  return <span className="text-xs font-medium">{state.charAt(0) + state.slice(1).toLowerCase()}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy connector id"
      aria-label="Copy connector id"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="mt-px shrink-0 text-black/35 opacity-0 transition group-hover/conn:opacity-100 hover:text-black/70 focus:opacity-100 dark:text-white/35 dark:hover:text-white/70"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function FrameworkBadge({ framework }: { framework?: string | null }) {
  if (framework === "nextjs") {
    return (
      <svg width="14" height="14" viewBox="0 0 180 180" fill="none" aria-label="Next.js" className="text-black/50 dark:text-white/50">
        <mask id="nxt-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180" style={{ maskType: "alpha" }}>
          <circle cx="90" cy="90" r="90" fill="currentColor" />
        </mask>
        <g mask="url(#nxt-mask)">
          <circle cx="90" cy="90" r="90" fill="currentColor" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1V69.3L139.986 164.845C143.242 162.481 146.395 159.985 149.508 157.52Z" fill="white" />
          <rect x="115" y="54" width="12" height="72" fill="white" />
        </g>
      </svg>
    );
  }
  return <span className="text-xs text-black/45 dark:text-white/45">{framework ?? "static"}</span>;
}

function Dash() {
  return <span className="text-black/40 dark:text-white/40">—</span>;
}

function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
