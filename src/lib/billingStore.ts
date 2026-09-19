"use client";

import { useCallback, useSyncExternalStore } from "react";

export type PlanId = "free" | "pro";

export type SubscriptionStatus =
  | "active"
  | "canceling"
  | "canceled"
  | "expired";

export type BillingState = {
  plan: PlanId;
  status: SubscriptionStatus;
  /** ISO date string */
  nextBillingDate: string;
  /** If canceling, features until this date */
  proUntil: string | null;
  paymentMethodLast4: string;
  usage: {
    projects: number;
    clients: number;
    storageGb: number;
  };
};

const STORAGE_KEY = "dueso:billing";

const DEFAULT: BillingState = {
  plan: "free",
  status: "active",
  nextBillingDate: "2026-10-12",
  proUntil: null,
  paymentMethodLast4: "4242",
  usage: {
    projects: 1,
    clients: 1,
    storageGb: 0.4,
  },
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function read(): BillingState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (!cachedBilling || cachedBillingKey !== "") {
        cachedBillingKey = "";
        cachedBilling = DEFAULT;
      }
      return cachedBilling;
    }
    if (cachedBilling && cachedBillingKey === raw) return cachedBilling;
    cachedBillingKey = raw;
    cachedBilling = { ...DEFAULT, ...JSON.parse(raw) } as BillingState;
    return cachedBilling;
  } catch {
    return DEFAULT;
  }
}

function write(next: BillingState) {
  const raw = JSON.stringify(next);
  sessionStorage.setItem(STORAGE_KEY, raw);
  cachedBillingKey = raw;
  cachedBilling = next;
  emit();
}

function getServerSnapshot() {
  return DEFAULT;
}

let cachedBilling: BillingState | null = null;
let cachedBillingKey: string | null = null;

export function useBilling() {
  const state = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const limits = {
    projects: state.plan === "pro" ? Infinity : 1,
    clients: state.plan === "pro" ? Infinity : 1,
    storageGb: state.plan === "pro" ? 10 : 1,
  };

  const isPro =
    state.plan === "pro" &&
    (state.status === "active" || state.status === "canceling");

  const upgradeToPro = useCallback(() => {
    const cur = read();
    write({
      ...cur,
      plan: "pro",
      status: "active",
      nextBillingDate: "2026-10-12",
      proUntil: null,
      usage: {
        projects: Math.max(cur.usage.projects, 3),
        clients: Math.max(cur.usage.clients, 8),
        storageGb: 1.2,
      },
    });
  }, []);

  const startCancel = useCallback(() => {
    const cur = read();
    write({
      ...cur,
      status: "canceling",
      proUntil: cur.nextBillingDate,
    });
  }, []);

  const keepPro = useCallback(() => {
    const cur = read();
    write({
      ...cur,
      status: "active",
      proUntil: null,
    });
  }, []);

  const setFree = useCallback(() => {
    write({
      ...read(),
      plan: "free",
      status: "expired",
      proUntil: null,
      usage: { projects: 1, clients: 1, storageGb: 0.4 },
    });
  }, []);

  const canCreateProject = isPro || state.usage.projects < limits.projects;

  return {
    state,
    limits,
    isPro,
    canCreateProject,
    upgradeToPro,
    startCancel,
    keepPro,
    setFree,
  };
}

export const BILLING_HISTORY = [
  {
    id: "b1",
    date: "Sep 12, 2026",
    description: "Dueso Pro",
    amount: "$9",
    status: "Paid" as const,
  },
  {
    id: "b2",
    date: "Aug 12, 2026",
    description: "Dueso Pro",
    amount: "$9",
    status: "Paid" as const,
  },
];

export function formatLimit(used: number, limit: number) {
  if (!Number.isFinite(limit)) return `${used} / Unlimited`;
  return `${used} / ${limit}`;
}
