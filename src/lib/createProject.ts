import { markSlugTaken, uniqueProjectSlug } from "./projectSlug";

export type CreatedProjectTask = {
  id: string;
  name: string;
  description?: string;
  done: boolean;
  visibleToClient: boolean;
};

export type CreatedProject = {
  id: string;
  slug: string;
  name: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  description: string;
  value: number | null;
  currency: string;
  deadline: string;
  status: "active" | "draft";
  tasks: CreatedProjectTask[];
  createdAt: string;
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
  status: "active" | "draft";
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
  return readStore();
}

export function getCreatedProjectBySlug(slug: string): CreatedProject | null {
  return (
    readStore().find((p) => p.slug.toLowerCase() === slug.toLowerCase()) ??
    null
  );
}

export function getCreatedProjectById(id: string): CreatedProject | null {
  return readStore().find((p) => p.id === id) ?? null;
}

export function buildCreatedProject(
  input: CreateProjectInput,
): { ok: true; project: CreatedProject } | { ok: false; errors: FieldErrors } {
  const errors = validateCreateProject(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const existing = readStore();
  const taken = [
    ...existing.map((p) => p.slug),
    "acme-website",
    "acme-website-redesign",
  ];

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
}

export function removeCreatedProject(id: string): CreatedProject | null {
  const existing = readStore();
  const removed = existing.find((p) => p.id === id) ?? null;
  if (!removed) return null;
  writeStore(existing.filter((p) => p.id !== id));
  return removed;
}

export function restoreCreatedProject(project: CreatedProject) {
  commitCreatedProject(project);
}

export const SEED_PROJECT_SLUG = "acme-website-redesign";
export const SEED_PORTAL_SLUG = "acme-website";

export function isKnownProjectSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  if (s === SEED_PROJECT_SLUG || s === SEED_PORTAL_SLUG) return true;
  return Boolean(getCreatedProjectBySlug(slug));
}
