"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";

type UploadFile = {
  file: File;
  path: string;
};
type UploadSelection = {
  files: UploadFile[];
  label: string;
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
  const dragDepth = useRef(0);
  const [selection, setSelection] = useState<UploadSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    for (const { file, path } of selection.files) {
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
      setMessage("Live and protected by Passport.");
      setUrl(payload.url);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function chooseSelection(nextSelection: UploadSelection | null) {
    setSelection(nextSelection);
    setStatus("idle");
    setMessage(null);
    setUrl(null);
    setRejected([]);
  }

  async function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (deploying) return;

    const files = await filesFromDrop(event.dataTransfer);
    chooseSelection(selectionFromFiles(files));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || deploying) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      zipInputRef.current?.click();
    }
  }

  return (
    <section
      aria-label="Deploy a Passport-protected microsite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        if (!deploying) setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = deploying ? "none" : "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={`relative flex min-h-[min(36rem,calc(100vh-10rem))] items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-16 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-black/30 dark:focus-visible:ring-white/40 ${
        isDragging
          ? "border-blue-500 bg-blue-500/[0.06] dark:border-blue-400 dark:bg-blue-400/[0.08]"
          : "border-black/20 bg-black/[0.015] dark:border-white/20 dark:bg-white/[0.02]"
      }`}
    >
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(event) => handleZipSelection(event, chooseSelection)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => handleFolderSelection(event, chooseSelection)}
        {...directoryInputProps}
      />

      <div className="relative z-10 w-full max-w-xl">
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
            isDragging
              ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:border-blue-400/30 dark:text-blue-300"
              : "border-black/10 bg-white text-black/70 shadow-sm dark:border-white/15 dark:bg-white/[0.06] dark:text-white/75"
          }`}
        >
          {isDragging ? <UploadIcon /> : <GlobeIcon />}
        </div>

        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          {isDragging ? "Drop to deploy with Passport." : "Deploy it. Passport protects it."}
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-black/55 dark:text-white/55">
          Drop in a static microsite, folder, or .zip. Or choose a{" "}
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            disabled={deploying}
            className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400"
          >
            .zip file
          </button>{" "}
          or a{" "}
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={deploying}
            className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:decoration-blue-400/30 dark:hover:decoration-blue-400"
          >
            folder
          </button>
          .
        </p>
        <p className="mt-1 text-sm text-black/40 dark:text-white/40">
          Passport applies access protection before your deployment URL is returned.
        </p>

        {selection ? (
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-black/10 bg-white p-3 text-left shadow-sm dark:border-white/15 dark:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-black/55 dark:bg-white/10 dark:text-white/60">
                <FileIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{selection.label}</p>
                <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">
                  {selection.files.length} {selection.files.length === 1 ? "file" : "files"} ready
                </p>
              </div>
              {!deploying ? (
                <button
                  type="button"
                  onClick={() => chooseSelection(null)}
                  className="rounded-md px-2 py-1 text-xs text-black/45 hover:bg-black/5 hover:text-black/70 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white/75"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={deploy}
              disabled={deploying}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-wait disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/80 dark:disabled:bg-white/40"
            >
              {deploying ? "Deploying with Passport…" : "Deploy with Passport"}
            </button>

            {deploying ? (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-black/50 dark:bg-white/60" />
              </div>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className={`mx-auto mt-4 max-w-md rounded-lg px-3 py-2 text-left text-xs ${
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
      </div>
    </section>
  );
}

function handleZipSelection(
  event: ChangeEvent<HTMLInputElement>,
  setSelection: (selection: UploadSelection | null) => void,
) {
  const file = event.target.files?.[0];
  event.target.value = "";
  setSelection(file ? selectionFromFiles([{ file, path: file.name }]) : null);
}

function handleFolderSelection(
  event: ChangeEvent<HTMLInputElement>,
  setSelection: (selection: UploadSelection | null) => void,
) {
  const files = Array.from(event.target.files ?? []).map((file) => ({
    file,
    path: (file as BrowserFile).webkitRelativePath || file.name,
  }));
  event.target.value = "";
  setSelection(selectionFromFiles(files));
}

function selectionFromFiles(files: UploadFile[]): UploadSelection | null {
  if (files.length === 0) return null;

  const root = commonRoot(files.map(({ path }) => path));
  const label = files.length === 1 ? files[0].file.name : root ?? `${files.length} files`;
  return { files, label };
}

function commonRoot(paths: string[]): string | null {
  const roots = new Set(paths.map((path) => path.split("/")[0]).filter(Boolean));
  return roots.size === 1 && paths.some((path) => path.includes("/")) ? [...roots][0] : null;
}

async function filesFromDrop(dataTransfer: DataTransfer): Promise<UploadFile[]> {
  const entries = Array.from(dataTransfer.items)
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null);

  if (entries.length > 0) {
    const nested = await Promise.all(entries.map((entry) => filesFromEntry(entry, "")));
    return nested.flat();
  }

  return Array.from(dataTransfer.files).map((file) => ({
    file,
    path: (file as BrowserFile).webkitRelativePath || file.name,
  }));
}

async function filesFromEntry(entry: FileSystemEntry, parentPath: string): Promise<UploadFile[]> {
  const path = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
    return [{ file, path }];
  }

  const entries = await readAllDirectoryEntries(entry as FileSystemDirectoryEntry);
  const nested = await Promise.all(entries.map((child) => filesFromEntry(child, path)));
  return nested.flat();
}

async function readAllDirectoryEntries(directory: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  const reader = directory.createReader();
  const entries: FileSystemEntry[] = [];

  while (true) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (batch.length === 0) return entries;
    entries.push(...batch);
  }
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M6 3h7l5 5v13H6V3Z" strokeLinejoin="round" />
      <path d="M13 3v5h5" strokeLinejoin="round" />
    </svg>
  );
}
