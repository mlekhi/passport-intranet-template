"use client";

import { useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { useRouter } from "next/navigation";

type UploadMode = "zip" | "folder";
type UploadSelection = {
  files: File[];
  label: string;
  mode: UploadMode;
};
type DeployResponse = {
  url?: string;
  error?: string;
  code?: string;
  detail?: string;
  rejected?: string[];
};
type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & {
  directory: string;
  webkitdirectory: string;
};
type BrowserFile = File & { webkitRelativePath?: string };

const directoryInputProps: DirectoryInputProps = {
  directory: "",
  webkitdirectory: "",
};

export function DeployUploader() {
  const router = useRouter();
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<UploadSelection | null>(null);
  const [status, setStatus] = useState<"idle" | "deploying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);

  const deploying = status === "deploying";

  async function deploy() {
    if (!selection || deploying) return;

    setStatus("deploying");
    setMessage(null);
    setUrl(null);
    setRejected([]);

    const form = new FormData();
    for (const file of selection.files) {
      const path = uploadPathFor(file, selection.mode);
      form.append("path", path);
      form.append("file", file, file.name);
    }

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as DeployResponse;

      if (!response.ok || !payload.url) {
        setStatus("error");
        setMessage(payload.error ?? `Deploy failed with status ${response.status}.`);
        setUrl(payload.url ?? null);
        setRejected(payload.rejected ?? []);
        return;
      }

      setStatus("success");
      setMessage("Deployed and protected.");
      setUrl(payload.url);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Deploy microsite</h2>
          <p className="mt-1 truncate text-xs text-black/50 dark:text-white/50">
            {selection ? selection.label : "No upload selected"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            disabled={deploying}
            className="h-8 rounded-md border border-black/10 px-3 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            Choose .zip
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={deploying}
            className="h-8 rounded-md border border-black/10 px-3 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
          >
            Choose folder
          </button>
          <button
            type="button"
            onClick={deploy}
            disabled={!selection || deploying}
            className="h-8 rounded-md bg-black px-3 text-xs font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/25 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:bg-white/25"
          >
            {deploying ? "Deploying..." : "Deploy"}
          </button>
        </div>
      </div>

      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(event) => handleZipSelection(event, setSelection, resetInput)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleFolderSelection(event, setSelection, resetInput)}
        {...directoryInputProps}
      />

      {deploying ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-black/50 dark:bg-white/60" />
        </div>
      ) : null}

      {message ? (
        <div
          role="status"
          className={`mt-3 rounded-md px-3 py-2 text-xs ${
            status === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="font-medium">{message}</div>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="mt-1 block break-all font-mono hover:underline">
              {url.replace(/^https?:\/\//, "")}
            </a>
          ) : null}
          {rejected.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {rejected.slice(0, 5).map((path) => (
                <span key={path} className="rounded bg-black/5 px-1.5 py-0.5 font-mono dark:bg-white/10">
                  {path}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );

  function resetInput(input: HTMLInputElement) {
    input.value = "";
    setStatus("idle");
    setMessage(null);
    setUrl(null);
    setRejected([]);
  }
}

function handleZipSelection(
  event: ChangeEvent<HTMLInputElement>,
  setSelection: (selection: UploadSelection | null) => void,
  resetInput: (input: HTMLInputElement) => void,
) {
  const file = event.target.files?.[0];
  resetInput(event.target);
  setSelection(file ? { files: [file], label: file.name, mode: "zip" } : null);
}

function handleFolderSelection(
  event: ChangeEvent<HTMLInputElement>,
  setSelection: (selection: UploadSelection | null) => void,
  resetInput: (input: HTMLInputElement) => void,
) {
  const files = Array.from(event.target.files ?? []);
  resetInput(event.target);
  if (files.length === 0) {
    setSelection(null);
    return;
  }

  const root = folderRoot(files);
  setSelection({
    files,
    label: `${root ?? "folder"} (${files.length} ${files.length === 1 ? "file" : "files"})`,
    mode: "folder",
  });
}

function folderRoot(files: File[]): string | null {
  const firstPath = (files[0] as BrowserFile | undefined)?.webkitRelativePath;
  const slash = firstPath?.indexOf("/") ?? -1;
  return slash === -1 ? null : firstPath!.slice(0, slash);
}

function uploadPathFor(file: File, mode: UploadMode): string {
  if (mode === "folder") {
    const relativePath = (file as BrowserFile).webkitRelativePath;
    if (relativePath) return relativePath;
  }
  return file.name;
}
