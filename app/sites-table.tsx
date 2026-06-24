import type { ReactNode } from "react";
import type { ProtectionStatus } from "@/lib/vercel";

export type StatusFilter = "all" | "protected" | "unprotected";

export function SitesTable({
  sites,
  query,
  status,
}: {
  sites: ProtectionStatus[];
  query: string;
  status: StatusFilter;
}) {
  return (
    <section className="space-y-3">
      <form method="get" className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search microsites…"
          className="h-8 flex-1 min-w-50 rounded-md border border-black/10 bg-transparent px-3 text-sm outline-none placeholder:text-black/40 focus:border-black/30 dark:border-white/15 dark:placeholder:text-white/40 dark:focus:border-white/40"
        />
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <div className="flex items-center gap-1">
          <FilterLink active={status === "all"} href={filterHref(query, "all")}>
            All
          </FilterLink>
          <FilterLink active={status === "protected"} href={filterHref(query, "protected")}>
            Protected
          </FilterLink>
          <FilterLink active={status === "unprotected"} href={filterHref(query, "unprotected")}>
            Unprotected
          </FilterLink>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[26%]" />
            <col className="w-[13%]" />
            <col className="w-[17%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
          </colgroup>
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
            {sites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-black/45 dark:text-white/45">
                  No microsites match.
                </td>
              </tr>
            ) : (
              sites.map((site) => (
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
                        className="font-mono text-xs break-all text-blue-600 hover:underline dark:text-blue-400"
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
                    {site.connectorId ? (
                      site.connectorName ? (
                        <div className="min-w-0">
                          <div className="text-xs font-medium">{site.connectorName}</div>
                          {site.connectorIdp ? (
                            <div className="font-mono text-[11px] text-black/45 dark:text-white/45">
                              {site.connectorIdp}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="select-all font-mono text-[11px] break-all text-black/55 dark:text-white/55">
                          {site.connectorId}
                        </span>
                      )
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

function filterHref(query: string, status: StatusFilter): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (status !== "all") params.set("status", status);
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className={
        "inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors " +
        (active
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10")
      }
    >
      {children}
    </a>
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

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2.5 font-medium">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function Dash() {
  return <span className="text-black/40 dark:text-white/40">—</span>;
}

function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toISOString().slice(0, 10);
}
