/**
 * Mock background sync for optimistic UI.
 * Replace with real API calls later — keep the same success/fail contract.
 */

export type SyncResult = { ok: true } | { ok: false; error?: string };

type SyncOptions = {
  /** Simulated latency ms */
  delay?: number;
  /** Force failure (for demos / tests) */
  fail?: boolean;
  /** Failure rate 0–1 when fail is not set (default 0) */
  failRate?: number;
};

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** Background request after an optimistic UI update. */
export async function backgroundSync(
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { delay = 420, fail = false, failRate = 0 } = options;
  await sleep(delay);
  if (fail || (failRate > 0 && Math.random() < failRate)) {
    return { ok: false, error: "Couldn't save that change." };
  }
  return { ok: true };
}

/**
 * Apply local change immediately, sync in background, rollback on failure.
 */
export async function runOptimistic<T>({
  apply,
  rollback,
  sync,
  onError,
}: {
  apply: () => T;
  rollback: (snapshot: T) => void;
  sync?: () => Promise<SyncResult>;
  onError?: (message: string) => void;
}): Promise<boolean> {
  const snapshot = apply();
  const result = await (sync ?? (() => backgroundSync()))();
  if (!result.ok) {
    rollback(snapshot);
    onError?.(result.error ?? "Couldn't save that change.");
    return false;
  }
  return true;
}
