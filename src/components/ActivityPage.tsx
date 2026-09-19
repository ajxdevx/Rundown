"use client";

import {
  CreditCard,
  Download,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ActivityCategory } from "@/data/notificationsMock";
import { useActivity } from "@/lib/notificationsStore";
import DashboardTopBar from "./DashboardTopBar";

type Filter = "all" | ActivityCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Clients" },
  { id: "files", label: "Files" },
  { id: "payments", label: "Payments" },
  { id: "messages", label: "Messages" },
];

function activityIcon(category: ActivityCategory) {
  switch (category) {
    case "projects":
      return FolderKanban;
    case "clients":
      return Users;
    case "files":
      return Download;
    case "payments":
      return CreditCard;
    case "messages":
      return MessageSquare;
  }
}

export default function ActivityPage() {
  const router = useRouter();
  const activity = useActivity();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return activity;
    return activity.filter((a) => a.category === filter);
  }, [activity, filter]);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Activity" />

      <div className="w-full flex-1 px-6 py-8 sm:px-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Activity
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Everything happening across your workspace.
          </p>
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
            <Sparkles className="size-8 text-muted" strokeWidth={1.5} />
            <h3 className="mt-4 text-lg font-semibold text-ink">
              No activity yet
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              Project activity will appear here.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((item, i) => {
              const Icon = activityIcon(item.category);
              return (
                <li
                  key={item.id}
                  className={
                    i < filtered.length - 1 ? "border-b border-border" : ""
                  }
                >
                  <button
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="flex w-full cursor-pointer items-start gap-3 px-5 py-4 text-left hover-soft"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {item.description}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.related}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {item.time}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
