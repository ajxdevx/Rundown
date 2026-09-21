"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  WORKSPACE_CHANGED,
  getActiveWorkspaceId,
} from "@/lib/workspaceStore";

export type PortalSettings = {
  showBranding: boolean;
  showContact: boolean;
  allowMessages: boolean;
  allowDownloads: boolean;
  showProjectValue: boolean;
  showDeadline: boolean;
  showPayments: boolean;
};

export type PreferenceSettings = {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  defaultProjectStatus: "Active" | "Draft";
  emailProduct: boolean;
  emailActivity: boolean;
  emailMessages: boolean;
  emailPayments: boolean;
};

export type ProfileSettings = {
  fullName: string;
  username: string;
  email: string;
  bio: string;
  photoDataUrl: string | null;
};

type WorkspacePrefsBag = Record<
  string,
  {
    portal: PortalSettings;
    preferences: PreferenceSettings;
  }
>;

const PORTAL_DEFAULTS: PortalSettings = {
  showBranding: true,
  showContact: true,
  allowMessages: true,
  allowDownloads: true,
  showProjectValue: false,
  showDeadline: true,
  showPayments: true,
};

const PREF_DEFAULTS: PreferenceSettings = {
  dateFormat: "DD/MM/YYYY",
  defaultProjectStatus: "Active",
  emailProduct: true,
  emailActivity: true,
  emailMessages: true,
  emailPayments: true,
};

const PROFILE_DEFAULTS: ProfileSettings = {
  fullName: "Alex Johnson",
  username: "alex",
  email: "alex@example.com",
  bio: "",
  photoDataUrl: null,
};

const WS_KEY = "dueso:settings-workspace";
const PROFILE_KEY = "dueso:settings-profile";
export const SETTINGS_CHANGED = "dueso:settings-changed";

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedPortal: PortalSettings | null = null;
let cachedPortalKey: string | null = null;
let cachedPrefs: PreferenceSettings | null = null;
let cachedPrefsKey: string | null = null;
let cachedProfile: ProfileSettings | null = null;
let cachedProfileRaw: string | null = null;

function invalidateCaches() {
  cachedPortal = null;
  cachedPortalKey = null;
  cachedPrefs = null;
  cachedPrefsKey = null;
  cachedProfile = null;
  cachedProfileRaw = null;
}

function emit() {
  invalidateCaches();
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SETTINGS_CHANGED));
  }
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
  emit();
}

function getWsBag(): WorkspacePrefsBag {
  return readJson(WS_KEY, {});
}

function getWsBundle(workspaceId: string) {
  const map = getWsBag();
  return (
    map[workspaceId] ?? {
      portal: { ...PORTAL_DEFAULTS },
      preferences: { ...PREF_DEFAULTS },
    }
  );
}

export function getPortalSettings(workspaceId?: string): PortalSettings {
  const id = workspaceId ?? getActiveWorkspaceId();
  return { ...PORTAL_DEFAULTS, ...getWsBundle(id).portal };
}

export function getPreferenceSettings(
  workspaceId?: string,
): PreferenceSettings {
  const id = workspaceId ?? getActiveWorkspaceId();
  return { ...PREF_DEFAULTS, ...getWsBundle(id).preferences };
}

export function getProfileSettings(): ProfileSettings {
  return { ...PROFILE_DEFAULTS, ...readJson(PROFILE_KEY, {}) };
}

function getPortalSnapshot(): PortalSettings {
  const id =
    typeof window !== "undefined"
      ? getActiveWorkspaceId()
      : "server";
  const raw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(WS_KEY) ?? ""
      : "";
  const key = `${id}:${raw}`;
  if (cachedPortal && cachedPortalKey === key) return cachedPortal;
  cachedPortalKey = key;
  cachedPortal = getPortalSettings(id === "server" ? undefined : id);
  return cachedPortal;
}

function getPrefsSnapshot(): PreferenceSettings {
  const id =
    typeof window !== "undefined"
      ? getActiveWorkspaceId()
      : "server";
  const raw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(WS_KEY) ?? ""
      : "";
  const key = `${id}:${raw}`;
  if (cachedPrefs && cachedPrefsKey === key) return cachedPrefs;
  cachedPrefsKey = key;
  cachedPrefs = getPreferenceSettings(id === "server" ? undefined : id);
  return cachedPrefs;
}

function getProfileSnapshot(): ProfileSettings {
  const raw =
    typeof window !== "undefined"
      ? sessionStorage.getItem(PROFILE_KEY) ?? ""
      : "";
  if (cachedProfile && cachedProfileRaw === raw) return cachedProfile;
  cachedProfileRaw = raw;
  cachedProfile = getProfileSettings();
  return cachedProfile;
}

export function updatePortalSettings(
  patch: Partial<PortalSettings>,
  workspaceId?: string,
): PortalSettings {
  const id = workspaceId ?? getActiveWorkspaceId();
  const map = getWsBag();
  const bundle = getWsBundle(id);
  const portal = { ...bundle.portal, ...patch };
  writeJson(WS_KEY, { ...map, [id]: { ...bundle, portal } });
  return portal;
}

export function updatePreferenceSettings(
  patch: Partial<PreferenceSettings>,
  workspaceId?: string,
): PreferenceSettings {
  const id = workspaceId ?? getActiveWorkspaceId();
  const map = getWsBag();
  const bundle = getWsBundle(id);
  const preferences = { ...bundle.preferences, ...patch };
  writeJson(WS_KEY, { ...map, [id]: { ...bundle, preferences } });
  return preferences;
}

export function updateProfileSettings(
  patch: Partial<ProfileSettings>,
): ProfileSettings {
  const next = { ...getProfileSettings(), ...patch };
  writeJson(PROFILE_KEY, next);
  return next;
}

export function usePortalSettings(): PortalSettings {
  return useSyncExternalStore(
    subscribe,
    getPortalSnapshot,
    () => PORTAL_DEFAULTS,
  );
}

export function usePreferenceSettings(): PreferenceSettings {
  return useSyncExternalStore(
    subscribe,
    getPrefsSnapshot,
    () => PREF_DEFAULTS,
  );
}

export function useProfileSettings(): ProfileSettings {
  return useSyncExternalStore(
    subscribe,
    getProfileSnapshot,
    () => PROFILE_DEFAULTS,
  );
}

export function useSettingsActions() {
  const setPortal = useCallback((patch: Partial<PortalSettings>) => {
    return updatePortalSettings(patch);
  }, []);
  const setPreferences = useCallback((patch: Partial<PreferenceSettings>) => {
    return updatePreferenceSettings(patch);
  }, []);
  const setProfile = useCallback((patch: Partial<ProfileSettings>) => {
    return updateProfileSettings(patch);
  }, []);
  return { setPortal, setPreferences, setProfile };
}

if (typeof window !== "undefined") {
  window.addEventListener(WORKSPACE_CHANGED, () => emit());
}
