"use client";

export type WorkspaceType =
  | "Freelancer"
  | "Agency"
  | "Studio"
  | "Consultancy"
  | "Other";

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  description: string;
  website: string;
  contactEmail: string;
  phone: string;
  location: string;
  legalName: string;
  taxId: string;
  currency: string;
  timezone: string;
  logoDataUrl: string | null;
  archived: boolean;
  createdAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
  type?: WorkspaceType;
};

export type WorkspaceFieldErrors = Partial<Record<"name" | "form", string>>;

const WORKSPACES_KEY = "dueso:workspaces";
const ACTIVE_KEY = "dueso:active-workspace";
export const WORKSPACE_CHANGED = "dueso:workspace-changed";
export const DEFAULT_WORKSPACE_ID = "ws_acme";

const SEED_WORKSPACES: Workspace[] = [
  {
    id: DEFAULT_WORKSPACE_ID,
    name: "Acme Studio",
    type: "Studio",
    description:
      "Independent design studio helping growing brands build better digital experiences.",
    website: "https://acmestudio.example",
    contactEmail: "hello@acmestudio.example",
    phone: "",
    location: "San Francisco, CA",
    legalName: "Acme Studio LLC",
    taxId: "",
    currency: "USD",
    timezone: "America/New_York",
    logoDataUrl: null,
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED));
}

function readWorkspaces(): Workspace[] {
  if (typeof window === "undefined") return SEED_WORKSPACES;
  try {
    const raw = sessionStorage.getItem(WORKSPACES_KEY);
    if (!raw) return [...SEED_WORKSPACES];
    const parsed = JSON.parse(raw) as Workspace[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...SEED_WORKSPACES];
    const ids = new Set(parsed.map((w) => w.id));
    const merged = [...parsed];
    for (const seed of SEED_WORKSPACES) {
      if (!ids.has(seed.id)) merged.unshift(seed);
    }
    return merged;
  } catch {
    return [...SEED_WORKSPACES];
  }
}

function writeWorkspaces(list: Workspace[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WORKSPACES_KEY, JSON.stringify(list));
}

function readActiveId(): string {
  if (typeof window === "undefined") return DEFAULT_WORKSPACE_ID;
  try {
    const id = sessionStorage.getItem(ACTIVE_KEY);
    if (id) {
      const ws = readWorkspaces().find((w) => w.id === id && !w.archived);
      if (ws) return id;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WORKSPACE_ID;
}

function writeActiveId(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACTIVE_KEY, id);
}

export function workspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "WS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getWorkspaces(includeArchived = false): Workspace[] {
  const list = readWorkspaces();
  return includeArchived ? list : list.filter((w) => !w.archived);
}

export function getWorkspaceById(id: string): Workspace | null {
  return readWorkspaces().find((w) => w.id === id) ?? null;
}

export function getActiveWorkspaceId(): string {
  return readActiveId();
}

export function getActiveWorkspace(): Workspace {
  const id = readActiveId();
  return (
    getWorkspaceById(id) ??
    getWorkspaces()[0] ??
    SEED_WORKSPACES[0]
  );
}

export function setActiveWorkspace(id: string): boolean {
  const ws = getWorkspaceById(id);
  if (!ws || ws.archived) return false;
  writeActiveId(id);
  notify();
  return true;
}

export function validateCreateWorkspace(
  input: CreateWorkspaceInput,
): WorkspaceFieldErrors {
  const errors: WorkspaceFieldErrors = {};
  if (!input.name.trim()) errors.name = "Workspace name is required.";
  return errors;
}

export function createWorkspaceOptimistic(
  input: CreateWorkspaceInput,
): { ok: true; workspace: Workspace } | { ok: false; errors: WorkspaceFieldErrors } {
  const errors = validateCreateWorkspace(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const workspace: Workspace = {
    id: `ws_${Date.now()}`,
    name: input.name.trim(),
    type: input.type ?? "Other",
    description: "",
    website: "",
    contactEmail: "",
    phone: "",
    location: "",
    legalName: "",
    taxId: "",
    currency: "USD",
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
    logoDataUrl: null,
    archived: false,
    createdAt: new Date().toISOString(),
  };

  writeWorkspaces([workspace, ...readWorkspaces()]);
  writeActiveId(workspace.id);
  notify();
  return { ok: true, workspace };
}

export function updateWorkspaceOptimistic(
  id: string,
  patch: Partial<Omit<Workspace, "id" | "createdAt">>,
): Workspace | null {
  const list = readWorkspaces();
  const idx = list.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  const updated = { ...list[idx], ...patch };
  const next = [...list];
  next[idx] = updated;
  writeWorkspaces(next);
  notify();
  return updated;
}

export function archiveWorkspace(id: string): boolean {
  const list = getWorkspaces();
  if (list.length <= 1) return false;
  const ws = getWorkspaceById(id);
  if (!ws || ws.archived) return false;

  updateWorkspaceOptimistic(id, { archived: true });
  if (getActiveWorkspaceId() === id) {
    const next = getWorkspaces().find((w) => w.id !== id);
    if (next) writeActiveId(next.id);
  }
  notify();
  return true;
}

export function restoreWorkspace(id: string): boolean {
  const ws = getWorkspaceById(id);
  if (!ws) return false;
  updateWorkspaceOptimistic(id, { archived: false });
  return true;
}

/** Destructive — not optimistic for the caller; completes then notifies. */
export function deleteWorkspace(id: string, confirmName: string): boolean {
  const ws = getWorkspaceById(id);
  if (!ws) return false;
  if (ws.name.trim() !== confirmName.trim()) return false;

  const remaining = readWorkspaces().filter((w) => w.id !== id);
  if (remaining.filter((w) => !w.archived).length === 0) return false;

  writeWorkspaces(remaining);
  if (getActiveWorkspaceId() === id) {
    const next = remaining.find((w) => !w.archived);
    if (next) writeActiveId(next.id);
  }
  notify();
  return true;
}
