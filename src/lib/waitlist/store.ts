import { promises as fs } from "fs";
import path from "path";
import type { WaitlistEntry } from "./types";
import { normalizeEmail } from "./validate";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "waitlist.json");

/** Process-local fallback when the filesystem is unavailable (e.g. some serverless hosts). */
const memoryStore = new Map<string, WaitlistEntry>();

type StoreFile = { entries: WaitlistEntry[] };

async function ensureStore(): Promise<StoreFile> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed?.entries || !Array.isArray(parsed.entries)) {
      return { entries: [] };
    }
    return parsed;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { entries: [] };
    // Fall back to memory if FS is not writable
    return {
      entries: Array.from(memoryStore.values()),
    };
  }
}

async function writeStore(file: StoreFile): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(file, null, 2), "utf8");
  } catch {
    // Keep memory mirror for this process
  }
  for (const entry of file.entries) {
    memoryStore.set(entry.email, entry);
  }
}

export async function findWaitlistByEmail(
  email: string,
): Promise<WaitlistEntry | null> {
  const key = normalizeEmail(email);
  const file = await ensureStore();
  return file.entries.find((e) => e.email === key) ?? memoryStore.get(key) ?? null;
}

export async function addWaitlistEntry(
  entry: WaitlistEntry,
): Promise<"created" | "duplicate"> {
  const key = normalizeEmail(entry.email);
  const file = await ensureStore();
  const existing =
    file.entries.find((e) => e.email === key) ?? memoryStore.get(key);
  if (existing) return "duplicate";

  const next: StoreFile = {
    entries: [{ ...entry, email: key }, ...file.entries],
  };
  await writeStore(next);
  return "created";
}

/** Optional outbound webhook for CRM / email tools. Never throws to the client. */
export async function notifyWaitlistWebhook(
  entry: WaitlistEntry,
): Promise<void> {
  const url = process.env.WAITLIST_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: entry.email,
        audience: entry.audience,
        source: entry.source,
        utm: entry.utm,
        createdAt: entry.createdAt,
      }),
    });
  } catch {
    /* swallow — signup already persisted */
  }
}
