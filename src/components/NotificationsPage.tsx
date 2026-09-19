"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DashboardTopBar from "./DashboardTopBar";
import { useNotifications } from "@/lib/notificationsStore";
import type { NotifCategory } from "@/data/notificationsMock";

type Filter = "all" | "unread" | NotifCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "payments", label: "Payments" },
  { id: "projects", label: "Projects" },
  { id: "messages", label: "Messages" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotifications();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "all") return true;
      if (filter === "unread") return !n.read;
      if (filter === "projects")
        return n.category === "projects" || n.category === "clients";
      return n.category === filter;
    });
  }, [notifications, filter]);

  const groups = ["Today", "Yesterday", "Earlier"] as const;

  const onMarkAll = () => {
    markAllRead();
  };

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Notifications" />

      <div className="w-full flex-1 px-6 py-8 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Notifications
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up."}
            </p>
          </div>
          <button
            type="button"
            onClick={onMarkAll}
            disabled={unreadCount === 0}
            className="inline-flex h-10 cursor-pointer items-center self-start rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`h-9 cursor-pointer rounded-xl px-3.5 text-sm font-medium ${
                filter === f.id
                  ? "bg-ink text-card"
                  : "border border-border text-muted hover-soft"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <Bell className="size-8 text-muted" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-semibold text-ink">
              You&apos;re all caught up
            </h3>
            <p className="mt-1.5 text-sm text-muted">No new notifications.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {groups.map((group) => {
              const items = filtered.filter((n) => n.timeGroup === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="border-b border-border bg-surface px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    {group}
                  </p>
                  <ul>
                    {items.map((n, i) => (
                      <li
                        key={n.id}
                        className={
                          i < items.length - 1 ? "border-b border-border" : ""
                        }
                      >
                        <button
                          type="button"
                          onClick={() => {
                            markRead(n.id);
                            router.push(n.href);
                          }}
                          className="flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left hover-soft"
                        >
                          <span
                            className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                              n.read ? "bg-transparent ring-1 ring-border" : "bg-accent"
                            }`}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
