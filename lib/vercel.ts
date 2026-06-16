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
  targets?: { production?: { alias?: string[] } };
  updatedAt?: number;
};

export type ConnectorResult = { id: string };

export type DeploymentFile = { file: string; data: string; encoding: "base64" };

export type DeployResult = { id: string; projectId: string; url: string };

type VercelDeployment = {
  id: string;
  url: string;
  projectId?: string;
  alias?: string[];
  aliasAssigned?: boolean;
  readyState?: string;
  status?: string;
};

export type ProtectionStatus = {
  projectId: string;
  name: string;
  protected: boolean;
  url?: string;
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
  const alias = project.targets?.production?.alias?.[0];
  return {
    projectId: project.id,
    name: project.name,
    protected: Boolean(connectorId),
    url: alias ? asHttpsUrl(alias) : undefined,
    connectorId,
    deploymentType: project.passport?.deploymentType,
    updatedAt: project.updatedAt,
  };
}

export async function listProtectionStatus(): Promise<ProtectionStatus[]> {
  const projects = await listProjects();
  return projects.map(toProtectionStatus);
}

// Deploy a set of static files as their own Vercel project, then wait for the
// production alias. Returns once a production URL exists (never a preview URL).
export async function createProjectAndDeploy(
  files: DeploymentFile[],
  opts: { name?: string; pollIntervalMs?: number; maxAttempts?: number } = {},
): Promise<DeployResult> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  const name = opts.name ?? generateProjectName();

  const deployment = await vercel<VercelDeployment>(
    apiPath("/v13/deployments", teamScope()),
    {
      method: "POST",
      body: JSON.stringify({
        name,
        project: name,
        files,
        target: "production",
        projectSettings: { framework: null, buildCommand: null, outputDirectory: "." },
      }),
    },
    token,
  );

  const projectId = requireProjectId(deployment);
  const url = await waitForProductionUrl(deployment.id, opts);
  return { id: deployment.id, projectId, url };
}

async function waitForProductionUrl(
  deploymentId: string,
  opts: { pollIntervalMs?: number; maxAttempts?: number } = {},
): Promise<string> {
  const interval = opts.pollIntervalMs ?? 2000;
  const maxAttempts = opts.maxAttempts ?? 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deployment = await getDeployment(deploymentId);
    const productionAlias = deployment.alias?.find((alias) => alias !== deployment.url);

    if (deployment.aliasAssigned && productionAlias) return asHttpsUrl(productionAlias);

    const state = deployment.readyState ?? deployment.status;
    if (state === "ERROR" || state === "CANCELED") {
      throw new Error(`Deployment ${deploymentId} finished with state ${state}; no production URL was assigned.`);
    }

    await sleep(interval);
  }

  throw new Error(
    `Timed out waiting for production alias for deployment ${deploymentId}. Refusing to return a preview URL.`,
  );
}

async function getDeployment(deploymentId: string): Promise<VercelDeployment> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  return vercel<VercelDeployment>(
    apiPath(`/v13/deployments/${encodeURIComponent(deploymentId)}`, teamScope()),
    { method: "GET" },
    token,
  );
}

function requireProjectId(deployment: VercelDeployment): string {
  if (!deployment.projectId) {
    throw new Error("Deployment response did not include projectId; cannot link a connector.");
  }
  return deployment.projectId;
}

function generateProjectName(): string {
  return `app-${Math.random().toString(36).slice(2, 10)}`;
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

// Create the Connect project-link (the REST behind `vercel connect attach`).
// This registers the project's redirect_uri with the connector and grants it
// token access — without it, Passport login fails with "redirect_uri is not
// registered for this client". Note: this endpoint has no /v1 prefix.
export async function linkProjectToConnector({
  projectId,
  connectorId,
}: {
  projectId: string;
  connectorId: string;
}): Promise<void> {
  const token = requiredEnv("VERCEL_ACCESS_TOKEN");
  await vercel<unknown>(
    apiPath(
      `/connect/connectors/${encodeURIComponent(connectorId)}/projects/${encodeURIComponent(projectId)}`,
      teamScope(),
    ),
    // The endpoint requires an `environments` array; link all three (matching
    // `vercel connect attach` with no --environment flag) so the production
    // deployment is covered.
    { method: "POST", body: JSON.stringify({ environments: ["production", "preview", "development"] }) },
    token,
  );
}

// Protect a project end to end against an existing, IdP-wired connector (the
// org's one connector, configured once). Two bindings are required: the Connect
// project-link (registers redirect_uri) AND the passport attach (turns on
// protection). Then read the project back and confirm it took — never trust the
// PATCH response alone.
export async function protectProject({
  projectId,
  connectorId = requiredEnv("CONNECTOR_ID"),
  deploymentType = "all",
}: {
  projectId: string;
  connectorId?: string;
  deploymentType?: PassportDeploymentType;
}): Promise<ProtectionStatus> {
  await linkProjectToConnector({ projectId, connectorId });
  await attachPassport({ idOrName: projectId, connectorId, deploymentType });

  const status = toProtectionStatus(await getProject(projectId));
  if (!status.protected) {
    throw new Error(
      `Passport attach did not take for project ${projectId}; read-back shows it is still unprotected.`,
    );
  }
  return status;
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

function asHttpsUrl(hostOrUrl: string): string {
  return hostOrUrl.startsWith("http://") || hostOrUrl.startsWith("https://") ? hostOrUrl : `https://${hostOrUrl}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
