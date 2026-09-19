"use client";

import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  clientStats,
  type Client,
  type ClientStatus,
} from "@/data/clientsMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { getAllClients } from "@/lib/clientsStore";
import DashboardTopBar from "./DashboardTopBar";
import EmptyState, { SearchEmpty } from "./EmptyState";
import { ClientListSkeleton } from "./skeletons";

type StatusFilter = "all" | ClientStatus;
type SortKey = "recently-added" | "recently-active" | "name";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ClientsPage() {
  const loading = useInitialLoading(420);
  const [clients, setClients] = useState<Client[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recently-active");

  useEffect(() => {
    setClients(getAllClients());
    setReady(true);
  }, []);

  const filtered = useMemo(() => {
    let list = [...clients];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.company?.toLowerCase().includes(q) ?? false),
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recently-added") return a.createdSort - b.createdSort;
      return a.lastActiveSort - b.lastActiveSort;
    });
    return list;
  }, [clients, query, statusFilter, sort]);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Clients" />

      <div className="w-full flex-1 px-6 py-8 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Clients
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Manage your clients and their projects.
            </p>
          </div>
          <Link
            href="/clients/new"
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-2xl btn-accent px-4 text-sm font-semibold"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            Add Client
          </Link>
        </div>

        {loading || !ready ? (
          <ClientListSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Clients will appear here when you add them."
            action={{
              label: "Add Client",
              href: "/clients/new",
              icon: Plus,
            }}
            secondary={
              <Link
                href="/projects/new"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold text-ink hover-soft"
              >
                Create Project
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-surface px-4 lg:max-w-md">
                <Search
                  className="size-4 shrink-0 text-muted"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search clients…"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "inactive", label: "Inactive" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`h-9 cursor-pointer rounded-xl px-3.5 text-sm font-medium transition-colors ${
                      statusFilter === f.id
                        ? "bg-accent text-ink"
                        : "border border-border text-muted hover-soft"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort clients"
                  className="h-9 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm text-muted outline-none focus:border-ink"
                >
                  <option value="recently-active">Recently active</option>
                  <option value="recently-added">Recently added</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <SearchEmpty
                query={query.trim() || "your filters"}
                onClear={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              />
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                {filtered.map((client, index) => {
                  const stats = clientStats(client);
                  return (
                    <li
                      key={client.id}
                      className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                        index < filtered.length - 1
                          ? "border-b border-border"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-ink">
                            {client.name}
                          </p>
                          {client.company ? (
                            <span className="truncate text-xs text-muted">
                              · {client.company}
                            </span>
                          ) : null}
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${
                              client.status === "active"
                                ? "bg-sky-500/15 text-sky-400"
                                : "bg-surface-strong text-muted"
                            }`}
                          >
                            {client.status}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {client.email}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                          <span>
                            {stats.activeProjects} active project
                            {stats.activeProjects === 1 ? "" : "s"}
                          </span>
                          <span>{formatMoney(stats.totalValue)} total</span>
                          <span>Last active: {client.lastActive}</span>
                        </div>
                      </div>
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center self-start rounded-xl bg-surface px-4 text-xs font-medium text-ink hover-soft sm:self-auto"
                      >
                        View
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
