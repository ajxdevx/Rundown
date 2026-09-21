"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  seedNotifications,
  type NotificationItem,
} from "@/data/notificationsMock";
import { backgroundSync } from "@/lib/optimistic";
import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_CHANGED,
  getActiveWorkspaceId,
} from "@/lib/workspaceStore";

const READ_KEY = "dueso:notifications-read";
const DELETED_KEY = "dueso:notifications-deleted";

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

function readMap(key: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, boolean>) {
  sessionStorage.setItem(key, JSON.stringify(map));
  cachedClientSnapshot = null;
  cachedClientKey = null;
  emit();
}

function buildSnapshot(
  readOverrides: Record<string, boolean>,
  deleted: Record<string, boolean>,
  workspaceId: string,
): NotificationItem[] {
  return seedNotifications
    .filter((n) => {
      const ws = n.workspaceId || DEFAULT_WORKSPACE_ID;
      if (ws !== workspaceId) return false;
      if (deleted[n.id]) return false;
      return true;
    })
    .map((n) =>
      readOverrides[n.id] !== undefined
        ? { ...n, read: readOverrides[n.id] }
        : { ...n },
    );
}

const SERVER_SNAPSHOT: NotificationItem[] = seedNotifications
  .filter((n) => (n.workspaceId || DEFAULT_WORKSPACE_ID) === DEFAULT_WORKSPACE_ID)
  .map((n) => ({ ...n }));

let cachedClientSnapshot: NotificationItem[] | null = null;
let cachedClientKey: string | null = null;
let activeWorkspaceCached = DEFAULT_WORKSPACE_ID;

function getNotificationsSnapshot(): NotificationItem[] {
  const workspaceId =
    typeof window !== "undefined"
      ? getActiveWorkspaceId()
      : DEFAULT_WORKSPACE_ID;
  activeWorkspaceCached = workspaceId;
  const readOverrides = readMap(READ_KEY);
  const deleted = readMap(DELETED_KEY);
  const key = `${workspaceId}:${JSON.stringify(readOverrides)}:${JSON.stringify(deleted)}`;
  if (cachedClientSnapshot && cachedClientKey === key) {
    return cachedClientSnapshot;
  }
  cachedClientKey = key;
  cachedClientSnapshot = buildSnapshot(readOverrides, deleted, workspaceId);
  return cachedClientSnapshot;
}

function getServerSnapshot(): NotificationItem[] {
  return SERVER_SNAPSHOT;
}

if (typeof window !== "undefined") {
  window.addEventListener(WORKSPACE_CHANGED, () => {
    cachedClientSnapshot = null;
    cachedClientKey = null;
    emit();
  });
}

export function useNotifications() {
  const notifications = useSyncExternalStore(
    subscribe,
    getNotificationsSnapshot,
    getServerSnapshot,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    const previous = readMap(READ_KEY);
    writeMap(READ_KEY, { ...previous, [id]: true });
    return backgroundSync().then((r) => {
      if (!r.ok) {
        writeMap(READ_KEY, previous);
        return false;
      }
      return true;
    });
  }, []);

  const markUnread = useCallback((id: string) => {
    const previous = readMap(READ_KEY);
    writeMap(READ_KEY, { ...previous, [id]: false });
    return backgroundSync().then((r) => {
      if (!r.ok) {
        writeMap(READ_KEY, previous);
        return false;
      }
      return true;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const previous = readMap(READ_KEY);
    const deleted = readMap(DELETED_KEY);
    const ws = getActiveWorkspaceId();
    const map = { ...previous };
    seedNotifications.forEach((n) => {
      if ((n.workspaceId || DEFAULT_WORKSPACE_ID) !== ws) return;
      if (deleted[n.id]) return;
      map[n.id] = true;
    });
    writeMap(READ_KEY, map);
    return backgroundSync().then((r) => {
      if (!r.ok) {
        writeMap(READ_KEY, previous);
        return false;
      }
      return true;
    });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    const previous = readMap(DELETED_KEY);
    writeMap(DELETED_KEY, { ...previous, [id]: true });
    void backgroundSync().then((r) => {
      if (!r.ok) writeMap(DELETED_KEY, previous);
    });
    return {
      undo: () => {
        const current = readMap(DELETED_KEY);
        const next = { ...current };
        delete next[id];
        writeMap(DELETED_KEY, next);
      },
    };
  }, []);

  return {
    notifications,
    unreadCount,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    workspaceId: activeWorkspaceCached,
  };
}

export function useUnreadBadge() {
  const { unreadCount } = useNotifications();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? unreadCount : 0;
}
