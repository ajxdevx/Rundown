"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastTone = "error" | "success" | "info" | "undo";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  undoLabel?: string;
  onUndo?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastInput = Omit<ToastItem, "id" | "tone"> & {
  tone?: ToastTone;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  error: (title: string, description?: string) => string;
  success: (title: string, description?: string) => string;
  undo: (
    title: string,
    onUndo: () => void,
    options?: { description?: string; undoLabel?: string },
  ) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

/** Safe toast hook — no-ops if provider is missing (portal pages). */
export function useToastOptional() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone ?? "info",
        undoLabel: input.undoLabel,
        onUndo: input.onUndo,
        actionLabel: input.actionLabel,
        onAction: input.onAction,
        duration: input.duration ?? (input.tone === "error" ? 5200 : 3600),
      };
      setItems((prev) => [...prev.slice(-3), item]);
      if (item.duration && item.duration > 0) {
        window.setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, tone: "error" }),
    [toast],
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, tone: "success" }),
    [toast],
  );

  const undo = useCallback(
    (
      title: string,
      onUndo: () => void,
      options?: { description?: string; undoLabel?: string },
    ) =>
      toast({
        title,
        description: options?.description,
        tone: "undo",
        undoLabel: options?.undoLabel ?? "Undo",
        onUndo,
        duration: 6000,
      }),
    [toast],
  );

  const value = useMemo(
    () => ({ toast, error, success, undo, dismiss }),
    [toast, error, success, undo, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="landing-toast-host pointer-events-none fixed bottom-20 left-1/2 z-[200] flex w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 flex-col gap-2 md:bottom-4 md:left-auto md:right-4 md:translate-x-0"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto animate-toast-in rounded-[12px] border px-4 py-3 shadow-[var(--shadow-elevated)] ${
              item.tone === "error"
                ? "border-danger/30 bg-card text-ink"
                : "border-border bg-card text-ink"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
                className="shrink-0 cursor-pointer text-xs font-medium text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            {(item.onUndo || item.onAction) && (
              <div className="mt-2 flex gap-2">
                {item.onUndo ? (
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-semibold text-ink underline-offset-2 hover:underline"
                    onClick={() => {
                      item.onUndo?.();
                      dismiss(item.id);
                    }}
                  >
                    {item.undoLabel ?? "Undo"}
                  </button>
                ) : null}
                {item.onAction ? (
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-semibold text-ink underline-offset-2 hover:underline"
                    onClick={() => {
                      item.onAction?.();
                      dismiss(item.id);
                    }}
                  >
                    {item.actionLabel ?? "Retry"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
