"use client";

import { Activity as ActivityLucide, Search } from "lucide-react";
import type { ActivityEvent } from "@/data/activityMock";
import ActivityRow from "./ActivityRow";
import EmptyState from "./EmptyState";

const GROUPS = ["Today", "Yesterday", "Earlier"] as const;

type ActivityListProps = {
  items: ActivityEvent[];
  compact?: boolean;
  /** Skip outer card chrome when nested inside an existing surface */
  bare?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  showGroups?: boolean;
  limit?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export default function ActivityList({
  items,
  compact = false,
  bare = false,
  emptyTitle = "No activity yet",
  emptyDescription = "Activity from your projects and clients will appear here as your workspace gets moving.",
  emptyAction,
  showGroups = true,
  limit,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}: ActivityListProps) {
  const visible = limit ? items.slice(0, limit) : items;
  const shell = bare
    ? ""
    : "overflow-hidden rounded-[12px] border border-border bg-card";

  if (visible.length === 0) {
    if (bare) {
      return (
        <EmptyState
          icon={ActivityLucide}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          compact
        />
      );
    }
    return (
      <div className={shell}>
        <EmptyState
          icon={ActivityLucide}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          compact
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      {showGroups ? (
        GROUPS.map((group) => {
          const groupItems = visible.filter((n) => n.timeGroup === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group}>
              <p className="border-b border-border bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted sm:px-5">
                {group}
              </p>
              <ul>
                {groupItems.map((item) => (
                  <ActivityRow key={item.id} item={item} compact={compact} />
                ))}
              </ul>
            </div>
          );
        })
      ) : (
        <ul>
          {visible.map((item) => (
            <ActivityRow key={item.id} item={item} compact={compact} />
          ))}
        </ul>
      )}
      {hasMore && onLoadMore ? (
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex h-9 w-full cursor-pointer items-center justify-center rounded-[8px] text-sm font-medium text-muted hover:bg-surface-hover hover:text-ink disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ActivitySearchEmpty({
  onClear,
  filtered,
}: {
  onClear?: () => void;
  filtered?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-card">
      <EmptyState
        icon={Search}
        title={filtered ? "No matching activity" : "No activity found"}
        description={
          filtered
            ? "Try changing your filters or date range."
            : "Try a different search or clear your filters."
        }
        action={
          onClear ? { label: "Clear filters", onClick: onClear } : undefined
        }
        compact
      />
    </div>
  );
}
