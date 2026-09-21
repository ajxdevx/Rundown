"use client";

import {
  Bell,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  ListTodo,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  NotifCategory,
  NotificationItem,
} from "@/data/notificationsMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { useNotifications } from "@/lib/notificationsStore";
import ContextMenu from "./ContextMenu";
import DashboardTopBar from "./DashboardTopBar";
import EmptyState from "./EmptyState";
import MenuDropdown from "./MenuDropdown";
import { NotificationsSkeleton } from "./skeletons";
import { useToastOptional } from "./ToastProvider";

type ReadFilter = "all" | "unread" | "read";
type CategoryFilter = "all" | NotifCategory;

const READ_FILTERS: { id: ReadFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All types" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Clients" },
  { id: "payments", label: "Payments" },
  { id: "messages", label: "Messages" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
];

const GROUPS = ["Today", "Yesterday", "Earlier"] as const;

function categoryIcon(category: NotifCategory) {
  switch (category) {
    case "messages":
      return MessageSquare;
    case "payments":
      return CreditCard;
    case "clients":
      return Users;
    case "tasks":
      return ListTodo;
    case "files":
      return FileText;
    case "projects":
    default:
      return FolderKanban;
  }
}

function moneyToneClass(status?: string | null) {
  switch (status) {
    case "paid":
      return "text-success";
    case "due":
      return "text-warning";
    case "overdue":
    case "failed":
      return "text-danger";
    case "processing":
      return "text-info";
    default:
      return "text-ink";
  }
}

function emptyCopy(
  readFilter: ReadFilter,
  category: CategoryFilter,
): { title: string; description: string } {
  if (readFilter === "unread") {
    return {
      title: "No unread notifications",
      description: "You're all caught up.",
    };
  }
  if (category !== "all") {
    const label =
      CATEGORY_FILTERS.find((c) => c.id === category)?.label.toLowerCase() ??
      "these";
    return {
      title: `No ${label} notifications`,
      description:
        "Updates in this category will appear here when something needs your attention.",
    };
  }
  if (readFilter === "read") {
    return {
      title: "No read notifications",
      description: "Notifications you open will appear here.",
    };
  }
  return {
    title: "You're all caught up",
    description:
      "Important updates from your projects and clients will appear here.",
  };
}

function NotificationRow({
  item,
  onOpen,
  onMenuAction,
}: {
  item: NotificationItem;
  onOpen: () => void;
  onMenuAction: (action: "read" | "unread" | "delete") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = categoryIcon(item.category);

  return (
    <li
      className={`group relative border-b border-border last:border-b-0 ${
        !item.read ? "bg-surface/60" : ""
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${item.read ? "Read" : "Unread"} notification. ${item.title}. ${item.context}. ${item.time}.`}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/15 sm:px-5"
      >
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[8px] ${
            item.priority === "action"
              ? "bg-accent-soft text-ink"
              : "bg-surface text-muted"
          }`}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span
              className={`min-w-0 flex-1 text-sm ${
                item.read ? "font-normal text-muted" : "font-semibold text-ink"
              }`}
            >
              {item.title}
            </span>
            {!item.read ? (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {item.context}
            {item.amount ? (
              <>
                {" · "}
                <span
                  className={`font-medium ${moneyToneClass(item.paymentStatus)}`}
                >
                  {item.amount}
                </span>
              </>
            ) : null}
          </span>
          <span className="mt-1 block text-xs text-muted-soft">{item.time}</span>
        </span>
      </button>
      <div
        className="absolute right-3 top-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        data-hover-stop
      >
        <button
          type="button"
          aria-label="Notification actions"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.75} />
        </button>
        <ContextMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onAction={(id) =>
            onMenuAction(id as "read" | "unread" | "delete")
          }
          items={[
            { id: "read", label: "Mark as read", icon: Eye },
            { id: "unread", label: "Mark as unread", icon: EyeOff },
            { id: "delete", label: "Delete", icon: Trash2, danger: true },
          ]}
          widthClass="w-48"
        />
      </div>
    </li>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToastOptional();
  const loading = useInitialLoading(360);
  const {
    notifications,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    unreadCount,
  } = useNotifications();
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [loadError, setLoadError] = useState(false);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === "unread" && n.read) return false;
      if (readFilter === "read" && !n.read) return false;
      if (category !== "all" && n.category !== category) return false;
      return true;
    });
  }, [notifications, readFilter, category]);

  const onOpen = (n: NotificationItem) => {
    void markRead(n.id).then((ok) => {
      if (!ok) toast?.error("Couldn't update notification. Try again.");
    });
    router.push(n.href);
  };

  const onMarkAll = () => {
    if (unreadCount === 0) return;
    void markAllRead().then((ok) => {
      if (!ok) {
        toast?.error("Couldn't mark notifications as read. Try again.");
      }
    });
  };

  const onMenuAction = (
    n: NotificationItem,
    action: "read" | "unread" | "delete",
  ) => {
    if (action === "read") {
      void markRead(n.id).then((ok) => {
        if (!ok) toast?.error("Couldn't update notification. Try again.");
      });
      return;
    }
    if (action === "unread") {
      void markUnread(n.id).then((ok) => {
        if (!ok) toast?.error("Couldn't update notification. Try again.");
      });
      return;
    }
    const { undo } = deleteNotification(n.id);
    toast?.undo("Notification removed", undo);
  };

  const empty = emptyCopy(readFilter, category);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Notifications" />

      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="page-title">Notifications</h2>
            <p className="mt-1.5 text-sm text-muted">
              Stay up to date with what needs your attention.
            </p>
          </div>
          {!loading && unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAll}
              className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] border border-border px-4 text-sm font-medium text-ink hover-soft sm:self-auto"
            >
              <Check className="size-3.5" strokeWidth={2} />
              Mark all as read
            </button>
          ) : null}
        </div>

        {loading ? (
          <NotificationsSkeleton />
        ) : loadError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-[12px] border border-border bg-card px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                Couldn&apos;t load notifications
              </p>
              <p className="mt-1 text-sm text-muted">
                Something went wrong while loading your notifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoadError(false)}
              className="inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {READ_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReadFilter(f.id)}
                    className={`h-9 cursor-pointer rounded-[8px] px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                      readFilter === f.id
                        ? "bg-accent text-ink"
                        : "border border-border text-muted hover:bg-surface-hover hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <MenuDropdown
                aria-label="Filter by category"
                value={category}
                onChange={(v) => setCategory(v as CategoryFilter)}
                options={CATEGORY_FILTERS}
                widthLabel="All types"
                menuClassName="w-44"
              />
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-[12px] border border-border bg-card">
                <EmptyState
                  icon={
                    readFilter === "unread" || notifications.length === 0
                      ? CheckCircle2
                      : Bell
                  }
                  title={empty.title}
                  description={empty.description}
                  compact
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[12px] border border-border bg-card">
                {GROUPS.map((group) => {
                  const items = filtered.filter((n) => n.timeGroup === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group}>
                      <p className="border-b border-border bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted sm:px-5">
                        {group}
                      </p>
                      <ul>
                        {items.map((n) => (
                          <NotificationRow
                            key={n.id}
                            item={n}
                            onOpen={() => onOpen(n)}
                            onMenuAction={(action) =>
                              onMenuAction(n, action)
                            }
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
