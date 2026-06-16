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
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search microsites…"
          className="h-8 flex-1 min-w-50 rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none placeholder:text-black/40 focus:border-black/30 dark:border-white/15 dark:placeholder:text-white/40 dark:focus:border-white/40"
        />
        <div className="flex items-center gap-1">
          <FilterButton active={status === "all"} onClick={() => setStatus("all")}>
            All
          </FilterButton>
          <FilterButton active={status === "protected"} onClick={() => setStatus("protected")}>
            Protected
          </FilterButton>
          <FilterButton active={status === "unprotected"} onClick={() => setStatus("unprotected")}>
            Unprotected
          </FilterButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
              <Th>Microsite</Th>
              <Th>URL</Th>
              <Th>Passport</Th>
              <Th>Connector</Th>
              <Th>Last deploy</Th>
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
                    <div className="text-xs text-black/45 dark:text-white/45">{site.framework ?? "static"}</div>
                  </Td>
                  <Td>
                    {site.url ? (
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {site.url.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <Dash />
                    )}
                  </Td>
                  <Td>
                    <ProtectionBadge protectedSite={site.protected} />
                  </Td>
                  <Td>
                    {site.connectorName ? (
                      <div>
                        <div className="text-xs font-medium">{site.connectorName}</div>
                        {site.connectorIdp ? (
                          <div className="font-mono text-[11px] text-black/45 dark:text-white/45">{site.connectorIdp}</div>
                        ) : null}
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

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-8 rounded-md px-3 text-xs font-medium transition-colors " +
        (active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function ProtectionBadge({ protectedSite }: { protectedSite: boolean }) {
  if (!protectedSite) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unprotected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Protected
    </span>
  );
}

function DeployState({ state }: { state?: string }) {
  if (!state) return <Dash />;
  const tone =
    state === "READY"
      ? "text-emerald-600 dark:text-emerald-400"
      : state === "ERROR" || state === "CANCELED"
        ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400";
  return <span className={`text-xs font-medium ${tone}`}>{state.toLowerCase()}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function Dash() {
  return <span className="text-black/40 dark:text-white/40">—</span>;
}

function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toISOString().slice(0, 10);
}
