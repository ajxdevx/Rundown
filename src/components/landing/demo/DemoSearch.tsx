"use client";

import { FileText, FolderKanban, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useDemoState } from "./DemoStateProvider";

export function DemoSearch() {
  const {
    searchQuery,
    setSearchQuery,
    setSearchOpen,
    projects,
    clients,
    files,
    openProject,
    openClient,
  } = useDemoState();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const q = searchQuery.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) {
      return {
        projects: projects.slice(0, 3),
        clients: clients.slice(0, 3),
        files: files.slice(0, 3),
      };
    }
    return {
      projects: projects.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q),
      ),
      clients: clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q),
      ),
      files: files.filter((f) => f.name.toLowerCase().includes(q)),
    };
  }, [q, projects, clients, files]);

  const empty =
    results.projects.length === 0 &&
    results.clients.length === 0 &&
    results.files.length === 0;

  return (
    <div className="absolute inset-x-0 top-0 z-40 border-b border-border bg-card shadow-[var(--shadow-elevated)]">
      <div className="flex h-12 items-center gap-2 px-3 sm:px-4">
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects, clients, files…"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
          aria-label="Demo search"
        />
        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setSearchOpen(false);
          }}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-ink"
          aria-label="Close search"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto border-t border-border px-2 py-2">
        {empty ? (
          <p className="px-2 py-4 text-center text-xs text-muted">
            No results for “{searchQuery}”
          </p>
        ) : (
          <>
            <ResultGroup
              label="Projects"
              icon={FolderKanban}
              items={results.projects.map((p) => ({
                id: p.id,
                title: p.name,
                meta: p.clientName,
                onSelect: () => {
                  openProject(p.id);
                  setSearchOpen(false);
                  setSearchQuery("");
                },
              }))}
            />
            <ResultGroup
              label="Clients"
              icon={Users}
              items={results.clients.map((c) => ({
                id: c.id,
                title: c.name,
                meta: c.contactName,
                onSelect: () => {
                  openClient(c.id);
                  setSearchOpen(false);
                  setSearchQuery("");
                },
              }))}
            />
            <ResultGroup
              label="Files"
              icon={FileText}
              items={results.files.map((f) => {
                const project = projects.find((p) => p.id === f.projectId);
                return {
                  id: f.id,
                  title: f.name,
                  meta: project?.name ?? f.meta,
                  onSelect: () => {
                    if (project) openProject(project.id, "files");
                    setSearchOpen(false);
                    setSearchQuery("");
                  },
                };
              })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ResultGroup({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: typeof FolderKanban;
  items: { id: string; title: string; meta: string; onSelect: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
        {label}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={item.onSelect}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hover"
            >
              <Icon className="size-3.5 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink">
                  {item.title}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {item.meta}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
