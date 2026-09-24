import { appendActivity } from "./activityStore";
import { markSlugTaken, uniqueProjectSlug } from "./projectSlug";
import { getActiveWorkspaceId } from "./workspaceStore";
import { SEED_PROJECTS } from "@/data/seedWorkspace";

export type ProjectLifecycleStatus =
  | "active"
  | "draft"
  | "on-hold"
  | "completed"
  | "archived";

/** Statuses available when creating a project. */
export type ProjectCreateStatus = "active" | "draft";

export type CreatedProjectTask = {
  id: string;
  name: string;
  description?: string;
  done: boolean;
  visibleToClient: boolean;
  status?: "todo" | "in-progress" | "completed";
  due?: string;
  updatedAt?: string;
};

export type CreatedProject = {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  description: string;
  value: number | null;
  currency: string;
  deadline: string;
  status: ProjectLifecycleStatus;
  tasks: CreatedProjectTask[];
  createdAt: string;
  updatedAt?: string;
  portalPath: string;
};

export type CreateProjectTaskInput = {
  name: string;
  description?: string;
  done: boolean;
  visibleToClient: boolean;
};

export type CreateProjectInput = {
  name: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  description: string;
  value: string;
  currency: string;
  deadline: string;
  status: ProjectLifecycleStatus;
  tasks: CreateProjectTaskInput[];
};

export type FieldErrors = Partial<
  Record<
    | "name"
    | "client"
    | "clientName"
    | "clientEmail"
    | "description"
    | "value"
    | "deadline"
    | "currency"
    | "status"
    | "tasks"
    | "form",
    string
  >
>;

const STORAGE_KEY = "rundown:created-projects";
const SEEDED_KEY = "rundown:projects-seeded-v3";
const DELETED_SEEDS_KEY = "rundown:deleted-seed-projects";

function readDeletedSeeds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(DELETED_SEEDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeletedSeeds(ids: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DELETED_SEEDS_KEY, JSON.stringify(ids));
}

function ensureProjectSeed() {
  if (typeof window === "undefined") return;
  const existing = readStore();
  const deleted = new Set(readDeletedSeeds());
  const seedIds = new Set(SEED_PROJECTS.map((p) => p.id));
  const version = sessionStorage.getItem(SEEDED_KEY);

  // Refresh all non-deleted seed rows when seed version changes.
  if (version !== "4") {
    const userProjects = existing.filter((p) => !seedIds.has(p.id));
    const seeds = SEED_PROJECTS.filter((p) => !deleted.has(p.id));
    writeStore([...seeds, ...userProjects]);
    seeds.forEach((p) => markSlugTaken(p.slug));
    sessionStorage.setItem(SEEDED_KEY, "4");
    return;
  }

  const existingIds = new Set(existing.map((p) => p.id));
  const toAdd = SEED_PROJECTS.filter(
    (p) => !existingIds.has(p.id) && !deleted.has(p.id),
  );
  if (toAdd.length > 0) {
    writeStore([...toAdd, ...existing]);
    toAdd.forEach((p) => markSlugTaken(p.slug));
  }
}

function parseDeadline(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(String(trimmed).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(num)) return NaN;
  return num;
}

export function validateCreateProject(input: CreateProjectInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) {
    errors.name = "Project name is required.";
  }

  if (!input.clientId && !input.clientName.trim()) {
    errors.client = "Please select a client.";
  }

  const valueNum = parseValue(input.value);
  if (input.value.trim() && (valueNum === null || Number.isNaN(valueNum) || valueNum < 0)) {
    errors.value = "Enter a valid project value.";
  }

  if (input.deadline.trim() && !parseDeadline(input.deadline)) {
    errors.deadline = "Enter a valid deadline date.";
  }

  if (!input.currency.trim()) {
    errors.currency = "Currency is required.";
  }

  const namedTasks = input.tasks.filter((t) => t.name.trim() || t.description?.trim());
  for (const t of namedTasks) {
    if (!t.name.trim()) {
      errors.tasks = "Task name is required.";
      break;
    }
  }

  return errors;
}

/** Soft warning — does not block submit. */
export function deadlineIsPast(deadline: string): boolean {
  const d = parseDeadline(deadline);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  return cmp < today;
}

function readStore(): CreatedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CreatedProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(projects: CreatedProject[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getCreatedProjects(): CreatedProject[] {
  ensureProjectSeed();
  const ws = getActiveWorkspaceId();
  const deletedSeeds = new Set(readDeletedSeeds());
  return readStore().filter(
    (p) =>
      (!p.workspaceId || p.workspaceId === ws) && !deletedSeeds.has(p.id),
  );
}

export function getCreatedProjectBySlug(slug: string): CreatedProject | null {
  ensureProjectSeed();
  const deletedSeeds = new Set(readDeletedSeeds());
  const found =
    readStore().find((p) => p.slug.toLowerCase() === slug.toLowerCase()) ??
    null;
  if (found && deletedSeeds.has(found.id)) return null;
  return found;
}

export function getCreatedProjectById(id: string): CreatedProject | null {
  ensureProjectSeed();
  const deletedSeeds = new Set(readDeletedSeeds());
  const found = readStore().find((p) => p.id === id) ?? null;
  if (found && deletedSeeds.has(found.id)) return null;
  return found;
}

export function buildCreatedProject(
  input: CreateProjectInput,
): { ok: true; project: CreatedProject } | { ok: false; errors: FieldErrors } {
  const errors = validateCreateProject(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const existing = readStore();
  const taken = existing.map((p) => p.slug);

  const slug = uniqueProjectSlug(input.name, taken);
  if (!slug) {
    return {
      ok: false,
      errors: { name: "Could not generate a valid project URL from this name." },
    };
  }

  const valueNum = parseValue(input.value);
  const value =
    valueNum === null || Number.isNaN(valueNum) ? null : valueNum;

  const project: CreatedProject = {
    id: `proj_${Date.now()}`,
    workspaceId: getActiveWorkspaceId(),
    slug,
    name: input.name.trim(),
    clientId: input.clientId,
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim(),
    description: input.description.trim(),
    value,
    currency: input.currency.trim().toUpperCase() || "USD",
    deadline: input.deadline.trim(),
    status: input.status,
    tasks: input.tasks
      .filter((t) => t.name.trim())
      .map((t, i) => ({
        id: `task_${Date.now()}_${i}`,
        name: t.name.trim(),
        description: t.description?.trim() || undefined,
        done: t.done,
        visibleToClient: t.visibleToClient,
      })),
    createdAt: new Date().toISOString(),
    portalPath: `/p/${slug}`,
  };

  return { ok: true, project };
}

export function commitCreatedProject(project: CreatedProject) {
  const existing = readStore().filter((p) => p.id !== project.id);
  writeStore([project, ...existing]);
  markSlugTaken(project.slug);
  notifyProjectsChanged();

  try {
    appendActivity({
      id: `act_create_${project.id}`,
      description: `You created ${project.name}`,
      context: project.clientName || "Project",
      category: "projects",
      href: `/projects/${project.slug}`,
      actorKind: "you",
      projectId: project.id,
      projectSlug: project.slug,
      projectName: project.name,
      clientName: project.clientName || undefined,
      workspaceId: project.workspaceId,
      createdAt: project.createdAt,
    });
  } catch {
    /* activity is secondary */
  }
}

export function updateCreatedProject(
  id: string,
  patch: Partial<
    Omit<CreatedProject, "id" | "slug" | "createdAt" | "portalPath">
  > & { tasks?: CreatedProjectTask[] },
): CreatedProject | null {
  const existing = readStore();
  const index = existing.findIndex((p) => p.id === id);
  if (index < 0) return null;
  const updated: CreatedProject = {
    ...existing[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const next = [...existing];
  next[index] = updated;
  writeStore(next);
  notifyProjectsChanged();
  return updated;
}

export function removeCreatedProject(id: string): CreatedProject | null {
  const existing = readStore();
  const removed = existing.find((p) => p.id === id) ?? null;
  if (!removed) return null;
  writeStore(existing.filter((p) => p.id !== id));
  if (SEED_PROJECTS.some((p) => p.id === id)) {
    const deleted = new Set(readDeletedSeeds());
    deleted.add(id);
    writeDeletedSeeds([...deleted]);
  }
  notifyProjectsChanged();
  return removed;
}

export function restoreCreatedProject(project: CreatedProject) {
  if (SEED_PROJECTS.some((p) => p.id === project.id)) {
    writeDeletedSeeds(readDeletedSeeds().filter((id) => id !== project.id));
  }
  commitCreatedProject(project);
}

export const PROJECTS_CHANGED = "dueso:projects-changed";

function notifyProjectsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROJECTS_CHANGED));
}

export function isKnownProjectSlug(slug: string): boolean {
  return Boolean(getCreatedProjectBySlug(slug));
}
