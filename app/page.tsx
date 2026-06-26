import { listProtectionStatus, type ProtectionStatus } from "@/lib/vercel";
import { SitesTable } from "./sites-table";

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
        <pre className="mt-3 overflow-x-auto rounded-md bg-black/5 p-3 font-mono text-xs dark:bg-white/5">{error}</pre>
      </div>
    );
  }

  if (sites.length === 0) {
    return <p className="text-sm text-black/60 dark:text-white/60">No projects found for this account or team.</p>;
  }

  const protectedCount = sites.filter((s) => s.protected).length;
  const unprotectedCount = sites.length - protectedCount;

  return (
    <div className="space-y-12">
      <header className="pb-4">
        <h1 className="text-4xl font-medium tracking-tight" style={{ textWrap: "balance" }}>
          Passport Intranet
        </h1>
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">
          Passport-protected microsites, deployed and monitored from one place.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3" aria-label="Summary">
        <Metric label="Microsites" value={sites.length} />
        <Metric label="Protected" value={protectedCount} />
        <Metric label="Unprotected" value={unprotectedCount} />
      </section>

      <SitesTable sites={sites} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 p-5 dark:border-white/10">
      <div className="text-sm text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-2 text-4xl font-normal tabular-nums">{value}</div>
    </div>
  );
}
