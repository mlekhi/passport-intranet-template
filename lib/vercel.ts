// Passport-management engine, ported from the deploy-with-passport demo.
// Server-side only — it reads VERCEL_ACCESS_TOKEN. Never import from a
// Client Component.
import "server-only";

const API = "https://api.vercel.com";

export type Json = Record<string, unknown>;
// Values per the Vercel REST API (project `passport.deploymentType`). The
// gateway uses "all" so production URLs are protected too.
export type PassportDeploymentType =
  | "all"
  | "all_except_custom_domains"
  | "preview"
  | "prod_deployment_urls_and_all_previews";

export type VercelProject = {
  id: string;
  name: string;
  // Passport configuration as returned by GET /v9/projects/:id. Confirmed
  // against the Vercel REST API: a nullable object with connectorId +
  // deploymentType.
  passport?: {
    connectorId?: string;
    deploymentType?: PassportDeploymentType;
  } | null;
  updatedAt?: number;
};

export type ConnectorResult = { id: string };

export type ProtectionStatus = {
  projectId: string;
  name: string;
  protected: boolean;
  connectorId?: string;
  deploymentType?: PassportDeploymentType;
  updatedAt?: number;
};

type TeamScope = { teamId?: string; slug?: string };

function teamScope(): TeamScope {
  return {
    teamId: env("VERCEL_TEAM_ID"),
    slug: env("VERCEL_TEAM_SLUG"),
  };
}

export async function listProjects(): Promise<VercelProject[]> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  const body = await vercel<{ projects: VercelProject[] }>(
    apiPath("/v9/projects", teamScope()),
    { method: "GET" },
    token,
  );
  return body.projects ?? [];
}

export async function getProject(idOrName: string): Promise<VercelProject> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  return vercel<VercelProject>(
    apiPath(`/v9/projects/${encodeURIComponent(idOrName)}`, teamScope()),
    { method: "GET" },
    token,
  );
}

// The "measure progress" read-back: derive protection state from the project
// itself rather than trusting a local flag set at deploy time.
export function toProtectionStatus(project: VercelProject): ProtectionStatus {
  const connectorId = project.passport?.connectorId;
  return {
    projectId: project.id,
    name: project.name,
    protected: Boolean(connectorId),
    connectorId,
    deploymentType: project.passport?.deploymentType,
    updatedAt: project.updatedAt,
  };
}

export async function listProtectionStatus(): Promise<ProtectionStatus[]> {
  const projects = await listProjects();
  return projects.map(toProtectionStatus);
}

export async function createConnector(connector: Json, projectId: string): Promise<ConnectorResult> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  return vercel<ConnectorResult>(
    apiPath("/v1/connect/connectors", teamScope()),
    {
      method: "POST",
      body: JSON.stringify({ ...withUniqueConnectorIdentity(connector), projectId }),
    },
    token,
  );
}

export async function attachPassport({
  idOrName,
  connectorId,
  deploymentType = "all",
}: {
  idOrName: string;
  connectorId: string;
  deploymentType?: PassportDeploymentType;
}): Promise<VercelProject> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  return vercel<VercelProject>(
    apiPath(`/v9/projects/${encodeURIComponent(idOrName)}`, teamScope()),
    {
      method: "PATCH",
      body: JSON.stringify({ passport: { connectorId, deploymentType } }),
    },
    token,
  );
}

// Build the default connector config from env, matching the demo's contract.
export function defaultConnectorConfig(): Json {
  const data = env("CONNECTOR_DATA");
  return {
    type: env("CONNECTOR_TYPE") ?? "oauth",
    service: requiredEnv("CONNECTOR_SERVICE"),
    name: env("CONNECTOR_NAME") ?? "Company Intranet SSO",
    environments: ["production", "preview"],
    triggers: true,
    events: [],
    data: data ? (JSON.parse(data) as Json) : {},
  };
}

function withUniqueConnectorIdentity(connector: Json): Json {
  // Date.now is fine here — this runs in the Node/server runtime, not the
  // workflow sandbox.
  const suffix = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const baseName = typeof connector.name === "string" && connector.name ? connector.name : "Passport Connector";
  const baseUid = typeof connector.uid === "string" && connector.uid ? connector.uid : "passport-connector";
  return { ...connector, name: `${baseName} ${suffix}`, uid: `${baseUid}-${suffix}` };
}

async function vercel<T>(path: string, init: RequestInit, token: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `Vercel API ${init.method ?? "GET"} ${path} failed (${response.status}): ${JSON.stringify(body, null, 2)}`,
    );
  }

  return body as T;
}

function apiPath(path: string, scope: TeamScope): string {
  const search = new URLSearchParams();
  if (scope.teamId) search.set("teamId", scope.teamId);
  if (scope.slug) search.set("slug", scope.slug);
  const encoded = search.toString();
  return encoded ? `${path}?${encoded}` : path;
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requiredEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}
