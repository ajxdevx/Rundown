"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  seedActivity,
  type ActivityEvent,
} from "@/data/activityMock";
import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_CHANGED,
  getActiveWorkspaceId,
} from "@/lib/workspaceStore";

const EXTRA_KEY = "dueso:activity-extra";
const REMOVED_KEY = "dueso:activity-removed";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  sessionStorage.setItem(key, JSON.stringify(value));
  cachedSnapshot = null;
  cachedKey = null;
  emit();
}

function buildSnapshot(workspaceId: string): ActivityEvent[] {
  const extra = readJson<ActivityEvent[]>(EXTRA_KEY, []);
  const removed = readJson<Record<string, boolean>>(REMOVED_KEY, {});
  const combined = [...extra, ...seedActivity]
    .filter((e) => {
      const ws = e.workspaceId || DEFAULT_WORKSPACE_ID;
      if (ws !== workspaceId) return false;
      if (removed[e.id]) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  // Deduplicate by id (prefer first = newer extras)
  const seen = new Set<string>();
  return combined.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

const SERVER_SNAPSHOT: ActivityEvent[] = seedActivity
  .filter((e) => (e.workspaceId || DEFAULT_WORKSPACE_ID) === DEFAULT_WORKSPACE_ID)
  .map((e) => ({ ...e }));

let cachedSnapshot: ActivityEvent[] | null = null;
let cachedKey: string | null = null;

function getSnapshot(): ActivityEvent[] {
  const workspaceId =
    typeof window !== "undefined"
      ? getActiveWorkspaceId()
      : DEFAULT_WORKSPACE_ID;
  const extra = readJson<ActivityEvent[]>(EXTRA_KEY, []);
  const removed = readJson<Record<string, boolean>>(REMOVED_KEY, {});
  const key = `${workspaceId}:${extra.length}:${JSON.stringify(removed)}`;
  if (cachedSnapshot && cachedKey === key) return cachedSnapshot;
  cachedKey = key;
  cachedSnapshot = buildSnapshot(workspaceId);
  return cachedSnapshot;
}

function getServerSnapshot(): ActivityEvent[] {
  return SERVER_SNAPSHOT;
}

if (typeof window !== "undefined") {
  window.addEventListener(WORKSPACE_CHANGED, () => {
    cachedSnapshot = null;
    cachedKey = null;
    emit();
  });
}

export type AppendActivityInput = Omit<
  ActivityEvent,
  "id" | "workspaceId" | "createdAt" | "timeGroup" | "time"
> & {
  id?: string;
  workspaceId?: string;
  createdAt?: string;
  time?: string;
  timeGroup?: ActivityEvent["timeGroup"];
};

function inferTimeGroup(iso: string): ActivityEvent["timeGroup"] {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  if (d >= startToday) return "Today";
  if (d >= startYesterday) return "Yesterday";
  return "Earlier";
}

/** Append an optimistic activity event. Returns undo remover. */
export function appendActivity(input: AppendActivityInput): () => void {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const event: ActivityEvent = {
    ...input,
    id: input.id ?? `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    workspaceId: input.workspaceId ?? getActiveWorkspaceId(),
    createdAt,
    time: input.time ?? "Just now",
    timeGroup: input.timeGroup ?? inferTimeGroup(createdAt),
  };
  const prev = readJson<ActivityEvent[]>(EXTRA_KEY, []);
  writeJson(EXTRA_KEY, [event, ...prev]);
  return () => {
    const current = readJson<ActivityEvent[]>(EXTRA_KEY, []);
    writeJson(
      EXTRA_KEY,
      current.filter((e) => e.id !== event.id),
    );
  };
}

export function removeActivity(id: string) {
  const removed = readJson<Record<string, boolean>>(REMOVED_KEY, {});
  writeJson(REMOVED_KEY, { ...removed, [id]: true });
}

export function useActivity(): ActivityEvent[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useActivityActions() {
  const append = useCallback((input: AppendActivityInput) => {
    return appendActivity(input);
  }, []);

  const remove = useCallback((id: string) => {
    removeActivity(id);
  }, []);

  return { append, remove };
}
