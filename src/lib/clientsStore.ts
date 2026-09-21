import {
  type Client,
  type ClientStatus,
} from "@/data/clientsMock";
import { SEED_CLIENTS } from "@/data/seedWorkspace";
import {
  DEFAULT_WORKSPACE_ID,
  getActiveWorkspaceId,
} from "./workspaceStore";

const CREATED_KEY = "dueso:created-clients";
const OVERRIDES_KEY = "dueso:client-overrides";
const DELETED_KEY = "dueso:deleted-clients";
export const CLIENTS_CHANGED = "dueso:clients-changed";

export type AddClientInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
  status?: ClientStatus;
};

export type ClientFieldErrors = Partial<
  Record<"name" | "email" | "form", string>
>;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAddClient(input: AddClientInput): ClientFieldErrors {
  const errors: ClientFieldErrors = {};
  if (!input.name.trim()) errors.name = "Client name is required.";
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(input.email))
    errors.email = "Enter a valid email address.";
  return errors;
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLIENTS_CHANGED));
}

function readCreated(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CREATED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Client[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreated(clients: Client[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CREATED_KEY, JSON.stringify(clients));
}

function readOverrides(): Record<string, Partial<Client>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<Client>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(map: Record<string, Partial<Client>>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
}

function readDeleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeleted(ids: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DELETED_KEY, JSON.stringify(ids));
}

function applyOverride(client: Client, patch?: Partial<Client>): Client {
  if (!patch) return client;
  return { ...client, ...patch };
}

export function getAllClients(): Client[] {
  const ws = getActiveWorkspaceId();
  const deleted = new Set(readDeleted());
  const overrides = readOverrides();
  const created = readCreated()
    .filter((c) => !deleted.has(c.id))
    .map((c) => applyOverride(c, overrides[c.id]))
    .filter((c) => (c.workspaceId ?? DEFAULT_WORKSPACE_ID) === ws);

  const createdIds = new Set(created.map((c) => c.id));
  const seeds = SEED_CLIENTS.filter(
    (c) =>
      !deleted.has(c.id) &&
      !createdIds.has(c.id) &&
      (c.workspaceId ?? DEFAULT_WORKSPACE_ID) === ws,
  ).map((c) => applyOverride(c, overrides[c.id]));

  return [...seeds, ...created];
}

export function getClientById(id: string): Client | null {
  return getAllClients().find((c) => c.id === id) ?? null;
}

export function addClientOptimistic(
  input: AddClientInput,
): { ok: true; client: Client } | { ok: false; errors: ClientFieldErrors } {
  const errors = validateAddClient(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const client: Client = {
    id: `c_${Date.now()}`,
    workspaceId: getActiveWorkspaceId(),
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim() || null,
    phone: input.phone.trim() || null,
    notes: input.notes.trim() || null,
    status: input.status ?? "active",
    lastActive: "Just now",
    lastActiveSort: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    createdSort: 0,
    outstanding: 0,
    projects: [],
    activity: [
      {
        id: `a_${Date.now()}`,
        text: "Client added",
        time: "Just now",
      },
    ],
  };

  try {
    writeCreated([client, ...readCreated()]);
    notify();
  } catch {
    return {
      ok: false,
      errors: { form: "Failed to save the client. Please try again." },
    };
  }

  return { ok: true, client };
}

export async function addClient(
  input: AddClientInput,
): Promise<
  { ok: true; client: Client } | { ok: false; errors: ClientFieldErrors }
> {
  return addClientOptimistic(input);
}

export function updateClientOptimistic(
  id: string,
  input: AddClientInput,
): { ok: true; client: Client } | { ok: false; errors: ClientFieldErrors } {
  const errors = validateAddClient(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const current = getClientById(id);
  if (!current) {
    return { ok: false, errors: { form: "Client not found." } };
  }

  const patch: Partial<Client> = {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim() || null,
    phone: input.phone.trim() || null,
    notes: input.notes.trim() || null,
    status: input.status ?? current.status,
    lastActive: "Just now",
    lastActiveSort: 0,
  };

  const created = readCreated();
  const createdIdx = created.findIndex((c) => c.id === id);
  if (createdIdx >= 0) {
    created[createdIdx] = { ...created[createdIdx], ...patch };
    writeCreated(created);
  } else {
    const overrides = readOverrides();
    overrides[id] = { ...overrides[id], ...patch };
    writeOverrides(overrides);
  }

  notify();
  return { ok: true, client: { ...current, ...patch } };
}

export function archiveClientLocal(id: string) {
  const created = readCreated();
  const idx = created.findIndex((c) => c.id === id);
  if (idx >= 0) {
    created[idx] = { ...created[idx], status: "inactive" };
    writeCreated(created);
  } else {
    const overrides = readOverrides();
    overrides[id] = { ...overrides[id], status: "inactive" };
    writeOverrides(overrides);
  }
  notify();
}

export function setClientStatusLocal(id: string, status: ClientStatus) {
  const created = readCreated();
  const idx = created.findIndex((c) => c.id === id);
  if (idx >= 0) {
    created[idx] = { ...created[idx], status };
    writeCreated(created);
  } else {
    const overrides = readOverrides();
    overrides[id] = { ...overrides[id], status };
    writeOverrides(overrides);
  }
  notify();
}

export function restoreClientLocal(client: Client) {
  const deleted = readDeleted().filter((id) => id !== client.id);
  writeDeleted(deleted);

  const created = readCreated().filter((c) => c.id !== client.id);
  writeCreated([client, ...created]);
  notify();
}

export function deleteClientLocal(id: string) {
  writeCreated(readCreated().filter((c) => c.id !== id));
  const overrides = readOverrides();
  if (overrides[id]) {
    delete overrides[id];
    writeOverrides(overrides);
  }
  const deleted = new Set(readDeleted());
  deleted.add(id);
  writeDeleted([...deleted]);
  notify();
}
