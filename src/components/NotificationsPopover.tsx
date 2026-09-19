"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useNotifications } from "@/lib/notificationsStore";

type NotificationsPopoverProps = {
  open: boolean;
  onClose: () => void;
};

export default function NotificationsPopover({
  open,
  onClose,
}: NotificationsPopoverProps) {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  const preview = notifications.slice(0, 6);
  const groups = ["Today", "Yesterday", "Earlier"] as const;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      const trigger = document.getElementById("notifications-trigger");
      if (trigger?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(17,17,17,0.12)]"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        <button
          type="button"
          onClick={markAllRead}
          className="cursor-pointer text-xs font-medium text-muted hover:text-ink"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {preview.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto size-6 text-muted" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-ink">
              You&apos;re all caught up
            </p>
            <p className="mt-1 text-xs text-muted">No new notifications.</p>
          </div>
        ) : (
          groups.map((group) => {
            const items = preview.filter((n) => n.timeGroup === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {group}
                </p>
                <ul>
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markRead(n.id);
                          onClose();
                          router.push(n.href);
                        }}
                        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left hover-soft"
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            n.read ? "bg-transparent" : "bg-accent"
                          }`}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm ${
                              n.read
                                ? "font-normal text-muted"
                                : "font-medium text-ink"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {n.time}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex h-10 w-full cursor-pointer items-center justify-center rounded-xl text-sm font-medium text-ink hover-soft"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
