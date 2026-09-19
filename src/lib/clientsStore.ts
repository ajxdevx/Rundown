import { seedClients, type Client, type ClientStatus } from "@/data/clientsMock";

const STORAGE_KEY = "rundown:created-clients";

export type AddClientInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
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

function readCreated(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Client[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreated(clients: Client[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function getAllClients(): Client[] {
  return [...readCreated(), ...seedClients];
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
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim() || null,
    phone: input.phone.trim() || null,
    notes: input.notes.trim() || null,
    status: "active" as ClientStatus,
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

export function archiveClientLocal(id: string) {
  const created = readCreated();
  const idx = created.findIndex((c) => c.id === id);
  if (idx >= 0) {
    created[idx] = { ...created[idx], status: "inactive" };
    writeCreated(created);
  }
}

export function restoreClientLocal(client: Client) {
  const created = readCreated().filter((c) => c.id !== client.id);
  writeCreated([client, ...created]);
}

export function deleteClientLocal(id: string) {
  writeCreated(readCreated().filter((c) => c.id !== id));
}
