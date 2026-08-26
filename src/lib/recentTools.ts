const STORAGE_KEY = "rundown:recent-tools";
const MAX_RECENT = 20;

export type RecentToolRef = {
  id: string;
  slug: string;
  name: string;
  viewedAt: number;
};

function readAll(): RecentToolRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentToolRef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RecentToolRef[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
}

export function getRecentToolRefs(): RecentToolRef[] {
  return readAll();
}

export function recordRecentTool(tool: {
  id: string;
  slug: string;
  name: string;
}) {
  const next = [
    { ...tool, viewedAt: Date.now() },
    ...readAll().filter((item) => item.id !== tool.id),
  ];
  writeAll(next);
}

export function getRecentToolIds(): string[] {
  return readAll().map((item) => item.id);
}
