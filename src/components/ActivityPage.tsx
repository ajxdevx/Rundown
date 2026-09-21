"use client";

import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ActivityCategory } from "@/data/activityMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { useActivity } from "@/lib/activityStore";
import { getAllClients } from "@/lib/clientsStore";
import { getCreatedProjects } from "@/lib/createProject";
import { useProjectModalOptional } from "./ProjectModalProvider";
import ActivityList, { ActivitySearchEmpty } from "./ActivityList";
import DashboardTopBar from "./DashboardTopBar";
import MenuDropdown from "./MenuDropdown";
import { ActivitySkeleton } from "./skeletons";

type TypeFilter = "all" | ActivityCategory;
type ActorFilter = "all" | "me" | "client";
type DateFilter = "all" | "today" | "7d" | "30d";
type SortKey = "newest" | "oldest";

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "projects", label: "Projects" },
  { id: "clients", label: "Clients" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
  { id: "invoices", label: "Invoices" },
  { id: "messages", label: "Messages" },
  { id: "portal", label: "Portal" },
  { id: "workspace", label: "Workspace" },
];

const ACTOR_OPTIONS = [
  { id: "all", label: "Everyone" },
  { id: "me", label: "Me" },
  { id: "client", label: "Client activity" },
] as const;

const DATE_OPTIONS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
] as const;

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
] as const;

const PAGE_SIZE = 12;

function withinDateFilter(iso: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (filter === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return t >= start.getTime();
  }
  if (filter === "7d") return t >= now - 7 * 24 * 60 * 60 * 1000;
  if (filter === "30d") return t >= now - 30 * 24 * 60 * 60 * 1000;
  return true;
}

export default function ActivityPage() {
  const searchParams = useSearchParams();
  const loading = useInitialLoading(360);
  const projectModal = useProjectModalOptional();
  const activity = useActivity();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadError, setLoadError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // URL deep-links from Project / Client detail
  useEffect(() => {
    const project = searchParams.get("project");
    const client = searchParams.get("client");
    if (project) setProjectFilter(project);
    if (client) setClientFilter(client);
  }, [searchParams]);

  const projectOptions = useMemo(() => {
    const projects = getCreatedProjects();
    return [
      { id: "all", label: "All projects" },
      ...projects.map((p) => ({ id: p.slug, label: p.name })),
    ];
  }, [activity]);

  const clientOptions = useMemo(() => {
    const clients = getAllClients();
    const fromActivity = activity
      .map((a) => a.clientName)
      .filter(Boolean) as string[];
    const names = new Set([
      ...clients.map((c) => c.name),
      ...fromActivity,
    ]);
    return [
      { id: "all", label: "All clients" },
      ...Array.from(names).map((name) => ({ id: name, label: name })),
    ];
  }, [activity]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = activity.filter((item) => {
      if (typeFilter !== "all" && item.category !== typeFilter) return false;
      if (actorFilter === "me" && item.actorKind !== "you") return false;
      if (actorFilter === "client" && item.actorKind !== "client") return false;
      if (
        projectFilter !== "all" &&
        item.projectSlug !== projectFilter &&
        item.projectName !== projectFilter
      ) {
        return false;
      }
      if (
        clientFilter !== "all" &&
        item.clientName !== clientFilter &&
        item.clientId !== clientFilter
      ) {
        return false;
      }
      if (!withinDateFilter(item.createdAt, dateFilter)) return false;
      if (q) {
        const hay = [
          item.description,
          item.context,
          item.projectName,
          item.clientName,
          item.actorName,
          item.amount,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === "oldest") {
      list = [...list].reverse();
    }
    return list;
  }, [
    activity,
    query,
    typeFilter,
    actorFilter,
    projectFilter,
    clientFilter,
    dateFilter,
    sort,
  ]);

  const filtersActive =
    typeFilter !== "all" ||
    actorFilter !== "all" ||
    projectFilter !== "all" ||
    clientFilter !== "all" ||
    dateFilter !== "all" ||
    query.trim().length > 0 ||
    sort !== "newest";

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setActorFilter("all");
    setProjectFilter("all");
    setClientFilter("all");
    setDateFilter("all");
    setSort("newest");
    setVisibleCount(PAGE_SIZE);
  };

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const onLoadMore = () => {
    setLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount((n) => n + PAGE_SIZE);
      setLoadingMore(false);
    }, 280);
  };

  const isSearchEmpty = query.trim().length > 0 && filtered.length === 0;
  const isFilterEmpty =
    filtersActive && !isSearchEmpty && filtered.length === 0 && activity.length > 0;
  const isCompletelyEmpty = activity.length === 0 && !filtersActive;

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Activity" />

      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="page-title">Activity</h2>
            <p className="mt-1.5 text-sm text-muted">
              See what&apos;s been happening across your workspace.
            </p>
          </div>
          {!loading && filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] btn-secondary px-4 text-sm font-semibold sm:self-auto"
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        {loading ? (
          <ActivitySkeleton />
        ) : loadError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-[12px] border border-border bg-card px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                Couldn&apos;t load activity
              </p>
              <p className="mt-1 text-sm text-muted">
                Something went wrong while loading your workspace activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoadError(false)}
              className="inline-flex h-9 cursor-pointer items-center rounded-[8px] btn-secondary px-3.5 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3">
              <div className="relative max-w-md">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  strokeWidth={1.75}
                />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search activity..."
                  aria-label="Search activity"
                  className="h-10 w-full rounded-[8px] border border-border bg-card pl-9 pr-9 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTypeFilter(f.id);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`h-9 cursor-pointer rounded-[8px] px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                      typeFilter === f.id
                        ? "bg-accent text-ink"
                        : "border border-border text-muted hover:bg-bg-hover hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <MenuDropdown
                  aria-label="Filter by actor"
                  value={actorFilter}
                  onChange={(v) => {
                    setActorFilter(v as ActorFilter);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  options={[...ACTOR_OPTIONS]}
                  widthLabel="Client activity"
                  menuClassName="w-44"
                  align="left"
                />
                <MenuDropdown
                  aria-label="Filter by project"
                  value={projectFilter}
                  onChange={(v) => {
                    setProjectFilter(v);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  options={projectOptions}
                  widthLabel="All projects"
                  menuClassName="w-56"
                  align="left"
                />
                <MenuDropdown
                  aria-label="Filter by client"
                  value={clientFilter}
                  onChange={(v) => {
                    setClientFilter(v);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  options={clientOptions}
                  widthLabel="All clients"
                  menuClassName="w-52"
                  align="left"
                />
                <MenuDropdown
                  aria-label="Filter by date"
                  value={dateFilter}
                  onChange={(v) => {
                    setDateFilter(v as DateFilter);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  options={[...DATE_OPTIONS]}
                  widthLabel="Last 30 days"
                  menuClassName="w-44"
                  align="left"
                />
                <MenuDropdown
                  aria-label="Sort activity"
                  value={sort}
                  onChange={(v) => setSort(v as SortKey)}
                  options={[...SORT_OPTIONS]}
                  labelPrefix="Sort: "
                  widthLabel="Sort: Newest first"
                  menuClassName="w-44"
                />
              </div>
            </div>

            {isCompletelyEmpty ? (
              <ActivityList
                items={[]}
                emptyTitle="No activity yet"
                emptyDescription="Activity from your projects and clients will appear here as your workspace gets moving."
                emptyAction={
                  projectModal
                    ? {
                        label: "Create Project",
                        onClick: () => projectModal.openCreate(),
                      }
                    : undefined
                }
              />
            ) : isSearchEmpty || isFilterEmpty ? (
              <ActivitySearchEmpty
                onClear={clearFilters}
                filtered={isFilterEmpty}
              />
            ) : (
              <ActivityList
                items={
                  sort === "oldest"
                    ? // Groups still use timeGroup; for oldest, flatten without misleading group order
                      visible
                    : visible
                }
                showGroups={sort === "newest"}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                loadingMore={loadingMore}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
