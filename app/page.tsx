import { listProtectionStatus, type ProtectionStatus } from "@/lib/vercel";

// Server Component — runs on the server, so the access token never reaches
// the browser. Reads protection state live from the Vercel API.
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  let sites: ProtectionStatus[] = [];
  let error: string | null = null;

  try {
    sites = await listProtectionStatus();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <div className="rounded-lg border border-black/10 bg-black/[0.02] p-5 text-sm dark:border-white/10 dark:bg-white/[0.03]">
        <p className="font-medium">Could not load projects from the Vercel API.</p>
        <p className="mt-2 text-black/60 dark:text-white/60">
          Set <code className="font-mono">VERCEL_ACCESS_TOKEN</code> (and{" "}
          <code className="font-mono">VERCEL_TEAM_ID</code> if this is a team) in{" "}
          <code className="font-mono">.env.local</code>. See <code className="font-mono">.env.example</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-black/5 p-3 font-mono text-xs dark:bg-white/5">
          {error}
        </pre>
      </div>
    );
  }

  if (sites.length === 0) {
    return <p className="text-sm text-black/60 dark:text-white/60">No projects found for this account or team.</p>;
  }

  const protectedCount = sites.filter((s) => s.protected).length;
  const unprotectedCount = sites.length - protectedCount;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-3">
        <Metric label="Microsites" value={sites.length} />
        <Metric label="Protected" value={protectedCount} tone="ok" />
        <Metric label="Unprotected" value={unprotectedCount} tone={unprotectedCount > 0 ? "warn" : "muted"} />
      </section>

      <section className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
              <Th>Microsite</Th>
              <Th>URL</Th>
              <Th>Protection</Th>
              <Th>Last deploy</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
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
                    <span className="text-black/40 dark:text-white/40">—</span>
                  )}
                </Td>
                <Td>
                  <ProtectionBadge site={site} />
                </Td>
                <Td>
                  <DeployState state={site.lastDeploymentState} />
                </Td>
                <Td>
                  <span className="text-xs text-black/55 dark:text-white/55">{formatDate(site.updatedAt)}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "ok" | "warn" | "muted" }) {
  const valueTone =
    tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</div>
    </div>
  );
}

function ProtectionBadge({ site }: { site: ProtectionStatus }) {
  if (!site.protected) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unprotected
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Protected
      </span>
      <span className="text-[11px] text-black/45 dark:text-white/45">{site.deploymentType ?? "all"}</span>
    </span>
  );
}

function DeployState({ state }: { state?: string }) {
  if (!state) return <span className="text-black/40 dark:text-white/40">—</span>;
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

function formatDate(epochMs?: number): string {
  if (!epochMs) return "—";
  return new Date(epochMs).toISOString().slice(0, 10);
}
