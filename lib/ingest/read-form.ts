// Read uploaded files out of a multipart form. A lone `.zip` is expanded; any
// other set of parts is taken as loose files keyed by filename. Either way the
// result is the flat path/bytes list the pipeline expects.
import { expandZip } from "@/lib/ingest/unzip";
import type { IngestFile } from "@/lib/ingest/prepare";

export async function filesFromForm(form: FormData): Promise<IngestFile[]> {
  const parts: File[] = [];
  for (const value of form.values()) {
    if (value instanceof File) parts.push(value);
  }
  const paths = form.getAll("path").filter((value): value is string => typeof value === "string");

  if (parts.length === 1 && parts[0].name.toLowerCase().endsWith(".zip")) {
    return expandZip(new Uint8Array(await parts[0].arrayBuffer()));
  }

  return Promise.all(
    parts.map(async (file, index) => ({
      path: safeUploadPath(paths[index]) ?? file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })),
  );
}

function safeUploadPath(path: string | undefined): string | null {
  const normalized = path?.replaceAll("\\", "/").trim();
  if (!normalized) return null;

  const segments = normalized.split("/").filter((segment) => segment && segment !== "." && segment !== "..");
  return segments.length > 0 ? segments.join("/") : null;
}
