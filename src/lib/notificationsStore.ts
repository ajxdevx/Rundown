"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  seedActivity,
  seedNotifications,
  type ActivityItem,
  type NotificationItem,
} from "@/data/notificationsMock";
import { backgroundSync } from "@/lib/optimistic";

const STORAGE_KEY = "dueso:notifications-read";

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

function readOverrides(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeOverrides(map: Record<string, boolean>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  cachedClientSnapshot = null;
  cachedClientKey = null;
  emit();
}

function buildSnapshot(overrides: Record<string, boolean>): NotificationItem[] {
  return seedNotifications.map((n) =>
    overrides[n.id] !== undefined ? { ...n, read: overrides[n.id] } : { ...n },
  );
}

/** Stable SSR snapshot — must be the same reference every call */
const SERVER_SNAPSHOT: NotificationItem[] = seedNotifications.map((n) => ({
  ...n,
}));

let cachedClientSnapshot: NotificationItem[] | null = null;
let cachedClientKey: string | null = null;

function getNotificationsSnapshot(): NotificationItem[] {
  const overrides = readOverrides();
  const key = JSON.stringify(overrides);
  if (cachedClientSnapshot && cachedClientKey === key) {
    return cachedClientSnapshot;
  }
  cachedClientKey = key;
  cachedClientSnapshot = buildSnapshot(overrides);
  return cachedClientSnapshot;
}

function getServerSnapshot(): NotificationItem[] {
  return SERVER_SNAPSHOT;
}

export function useNotifications() {
  const notifications = useSyncExternalStore(
    subscribe,
    getNotificationsSnapshot,
    getServerSnapshot,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    const previous = readOverrides();
    writeOverrides({ ...previous, [id]: true });
    void backgroundSync().then((r) => {
      if (!r.ok) writeOverrides(previous);
    });
  }, []);

  const markAllRead = useCallback(() => {
    const previous = readOverrides();
    const map = { ...previous };
    seedNotifications.forEach((n) => {
      map[n.id] = true;
    });
    writeOverrides(map);
    void backgroundSync().then((r) => {
      if (!r.ok) writeOverrides(previous);
    });
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}

export function useActivity(): ActivityItem[] {
  const [items] = useState(seedActivity);
  return items;
}

/**
 * Badge count that stays at 0 until after mount so SSR seed data
 * doesn't flash then get overridden by sessionStorage read state.
 */
export function useUnreadBadge() {
  const { unreadCount } = useNotifications();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? unreadCount : 0;
}
