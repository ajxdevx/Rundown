"use client";

import { Bell, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useDemoState } from "./DemoStateProvider";
import { DemoSearch } from "./DemoSearch";
import { ixIcon } from "../motion/interaction";

export function DemoTopBar({ title, context }: { title: string; context?: string }) {
  const {
    workspace,
    setCreateModalOpen,
    setSearchOpen,
    searchOpen,
    unreadCount,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useDemoState();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (notifRef.current?.contains(e.target as Node)) return;
      setNotifOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  return (
    <div className="relative flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4">
      <div className="min-w-0">
        {context ? (
          <p className="truncate text-[11px] text-muted">{context}</p>
        ) : null}
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-ink sm:px-2.5"
          aria-label="Open search"
        >
          <Search className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Search</span>
        </button>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-ink px-2 text-xs font-medium text-card transition-opacity hover:opacity-90 sm:px-2.5"
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">New</span>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className={`${ixIcon} relative size-8`}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="size-4" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
            ) : null}
          </button>

          {notifOpen ? (
            <div
              role="dialog"
              aria-label="Notifications"
              className="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-[var(--radius-md)] border border-border bg-card shadow-[var(--shadow-popover)]"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-semibold text-ink">Notifications</p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-muted hover:text-ink"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </button>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-hover ${
                        n.read ? "opacity-70" : ""
                      }`}
                    >
                      <span className="text-xs font-medium text-ink">
                        {n.title}
                      </span>
                      <span className="text-[11px] text-muted">{n.context}</span>
                      <span className="text-[10px] text-muted-soft">
                        {n.time}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Avatar name={workspace.ownerName} size="sm" className="ml-0.5" />
      </div>

      {searchOpen ? <DemoSearch /> : null}
    </div>
  );
}
