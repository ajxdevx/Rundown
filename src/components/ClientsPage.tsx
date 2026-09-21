"use client";

import {
  Archive,
  Copy,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ContextMenu from "@/components/ContextMenu";
import DashboardTopBar from "@/components/DashboardTopBar";
import EmptyState from "@/components/EmptyState";
import MenuDropdown from "@/components/MenuDropdown";
import { ClientsPageSkeleton } from "@/components/skeletons";
import { useToastOptional } from "@/components/ToastProvider";
import { useClientModal } from "@/components/ClientModalProvider";
import { useProjectModal } from "@/components/ProjectModalProvider";
import {
  projectStatusIcon,
  StatusBadge,
} from "@/components/ui/StatusBadge";
import {
  clientStats,
  type Client,
  type ClientStatus,
} from "@/data/clientsMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import {
  archiveClientLocal,
  CLIENTS_CHANGED,
  deleteClientLocal,
  getAllClients,
  restoreClientLocal,
  setClientStatusLocal,
} from "@/lib/clientsStore";
import { backgroundSync } from "@/lib/optimistic";

type StatusFilter = "all" | ClientStatus;
type SortKey =
  | "recently-added"
  | "recently-active"
  | "name-asc"
  | "name-desc";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "recently-added", label: "Recently added" },
  { id: "recently-active", label: "Recently active" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
];

const LIST_COLS =
  "lg:grid-cols-[minmax(0,1.5fr)_8.5rem_8rem_7rem_7.5rem_5.5rem_2.5rem]";

const chipClass = (active: boolean) =>
  `h-8 cursor-pointer rounded-[8px] px-3 text-xs font-medium transition-colors ${
    active
      ? "bg-accent-soft text-ink"
      : "text-muted hover:bg-surface-hover hover:text-ink"
  }`;

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function clientStatusLabel(status: ClientStatus) {
  return status === "active" ? "Active" : "Inactive";
}

function ClientRowMenu({
  open,
  onClose,
  onAction,
  position,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  position: { x: number; y: number } | null;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      position={position}
      clampHeight={320}
      items={[
        { id: "open", label: "Open Client", icon: Users },
        { id: "edit", label: "Edit Client", icon: Pencil },
        { id: "project", label: "Create Project", icon: FolderKanban },
        { id: "copy-email", label: "Copy Email", icon: Copy },
        {
          id: "archive",
          label: "Archive Client",
          icon: Archive,
          dividerBefore: true,
        },
        { id: "delete", label: "Delete Client", icon: Trash2, danger: true },
      ]}
    />
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const toast = useToastOptional();
  const { openCreate } = useProjectModal();
  const { openAdd, openEdit } = useClientModal();
  const loading = useInitialLoading(420);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recently-active");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const refresh = () => {
    try {
      setClients(getAllClients());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(CLIENTS_CHANGED, onChange);
    window.addEventListener("dueso:workspace-changed", onChange);
    return () => {
      window.removeEventListener(CLIENTS_CHANGED, onChange);
      window.removeEventListener("dueso:workspace-changed", onChange);
    };
  }, []);

  const closeMenu = () => {
    setMenuId(null);
    setMenuPos(null);
  };

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
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "recently-added")
        return a.createdSort - b.createdSort;
      return a.lastActiveSort - b.lastActiveSort;
    });
    return list;
  }, [clients, query, statusFilter, sort]);

  const hasActiveFilters =
    statusFilter !== "all" || query.trim().length > 0;

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  const copyEmail = async (client: Client) => {
    try {
      await navigator.clipboard.writeText(client.email);
      toast?.success("Email copied");
    } catch {
      toast?.error("Couldn't copy the email.");
    }
  };

  const archiveClient = (client: Client) => {
    const prev = clients;
    archiveClientLocal(client.id);
    setClients(getAllClients());
    toast?.undo("Client archived", () => {
      setClientStatusLocal(client.id, "active");
      setClients(prev);
    });
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setClientStatusLocal(client.id, client.status);
        setClients(prev);
        toast?.error("Couldn't update the client. Try again.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const snapshot = deleteTarget;
    const prev = clients;
    deleteClientLocal(snapshot.id);
    setClients(getAllClients());
    setDeleteTarget(null);
    void backgroundSync().then((r) => {
      if (!r.ok) {
        restoreClientLocal(snapshot);
        setClients(prev);
        toast?.error("Couldn't delete the client. Try again.");
      } else {
        toast?.success("Client deleted");
      }
    });
  };

  const onMenuAction = (client: Client, action: string) => {
    if (action === "open") {
      router.push(`/clients/${client.id}`);
      return;
    }
    if (action === "edit") {
      openEdit({
        clientId: client.id,
        onUpdated: (updated) => {
          setClients((list) =>
            list.map((c) => (c.id === updated.id ? updated : c)),
          );
        },
      });
      return;
    }
    if (action === "project") {
      openCreate({ clientId: client.id });
      return;
    }
    if (action === "copy-email") {
      void copyEmail(client);
      return;
    }
    if (action === "archive") {
      archiveClient(client);
      return;
    }
    if (action === "delete") {
      setDeleteTarget(client);
    }
  };

  const emptyTitle = (() => {
    if (clients.length === 0) return null;
    if (filtered.length === 0) return "No clients found";
    return null;
  })();

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Clients" />

      {loading ? (
        <ClientsPageSkeleton />
      ) : (
        <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="page-title">Clients</h2>
              <p className="mt-1.5 text-sm text-muted">
                Manage your clients and their projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAdd()}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold sm:self-auto"
            >
              <Plus className="size-4" strokeWidth={2.25} />
              Add Client
            </button>
          </div>

          {loadError ? (
            <div
              role="alert"
              className="card-surface flex flex-col items-start gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-ink">
                  Couldn&apos;t load clients
                </p>
                <p className="mt-1 text-sm text-muted">
                  Try again to view your clients.
                </p>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-primary px-4 text-sm font-semibold"
              >
                Retry
              </button>
            </div>
          ) : clients.length === 0 ? (
            <div className="card-surface">
              <EmptyState
                icon={Users}
                title="No clients yet"
                description="Add your first client to start managing your client relationships and projects."
                action={{
                  label: "Add Client",
                  onClick: () => openAdd(),
                  icon: Plus,
                }}
                compact
              />
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                    strokeWidth={1.75}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search clients..."
                    aria-label="Search clients"
                    className="input-field h-10 w-full rounded-[8px] pl-9 pr-9 text-sm"
                  />
                  {query ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Client status"
                    className="flex flex-wrap gap-1.5"
                  >
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
                        className={chipClass(statusFilter === f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <MenuDropdown
                    value={sort}
                    onChange={(v) => setSort(v as SortKey)}
                    options={SORT_OPTIONS}
                    labelPrefix="Sort: "
                    widthLabel="Sort: Recently active"
                  />
                </div>
              </div>

              {emptyTitle ? (
                <div className="card-surface">
                  <EmptyState
                    icon={Users}
                    title={emptyTitle}
                    description="Try adjusting your search or filters."
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear filters",
                            onClick: clearFilters,
                          }
                        : undefined
                    }
                    compact
                  />
                </div>
              ) : (
                <div className="card-surface overflow-hidden">
                  <div
                    className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${LIST_COLS}`}
                  >
                    <span>Client</span>
                    <span>Active projects</span>
                    <span>Total projects</span>
                    <span>Total value</span>
                    <span>Last activity</span>
                    <span>Status</span>
                    <span className="sr-only">Actions</span>
                  </div>

                  <ul>
                    {filtered.map((client) => {
                      const stats = clientStats(client);
                      const openClient = () =>
                        router.push(`/clients/${client.id}`);
                      return (
                        <li
                          key={client.id}
                          className="border-b border-border last:border-0"
                        >
                          <div
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              const t = e.target as HTMLElement;
                              if (
                                t.closest("button") ||
                                t.closest("a") ||
                                t.closest("[role='menu']")
                              ) {
                                return;
                              }
                              openClient();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openClient();
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setMenuId(client.id);
                              setMenuPos({ x: e.clientX, y: e.clientY });
                            }}
                            className={`grid cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent lg:gap-4 ${LIST_COLS}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {client.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-muted">
                                {[client.company, client.email]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>

                            <p className="text-sm text-ink">
                              {stats.activeProjects}
                            </p>
                            <p className="text-sm text-ink">
                              {stats.totalProjects}
                            </p>
                            <p className="text-sm font-medium text-ink">
                              {formatMoney(stats.totalValue)}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {client.lastActive}
                            </p>
                            <div>
                              <StatusBadge
                                label={clientStatusLabel(client.status)}
                                tone={
                                  client.status === "active"
                                    ? "active"
                                    : "neutral"
                                }
                                icon={
                                  client.status === "active"
                                    ? projectStatusIcon("active")
                                    : projectStatusIcon("archived")
                                }
                              />
                            </div>

                            <div className="relative flex justify-end">
                              <button
                                type="button"
                                data-hover-stop
                                aria-label={`Actions for ${client.name}`}
                                aria-expanded={menuId === client.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (menuId === client.id) {
                                    closeMenu();
                                    return;
                                  }
                                  const rect = (
                                    e.currentTarget as HTMLButtonElement
                                  ).getBoundingClientRect();
                                  setMenuId(client.id);
                                  setMenuPos({
                                    x: Math.min(
                                      rect.right - 208,
                                      window.innerWidth - 220,
                                    ),
                                    y: rect.bottom + 6,
                                  });
                                }}
                                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-muted outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20"
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {menuId && menuPos ? (
        <ClientRowMenu
          open
          position={menuPos}
          onClose={closeMenu}
          onAction={(a) => {
            const client = clients.find((c) => c.id === menuId);
            if (client) onMenuAction(client, a);
            closeMenu();
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget
            ? `Delete ${deleteTarget.name}?`
            : "Delete this client?"
        }
        description="Deleting the client won't delete their projects."
        confirmLabel="Delete Client"
      />
    </div>
  );
}
