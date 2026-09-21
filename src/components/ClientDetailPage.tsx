"use client";

import {
  Archive,
  Copy,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ContextMenu from "@/components/ContextMenu";
import DashboardTopBar from "@/components/DashboardTopBar";
import EmptyState from "@/components/EmptyState";
import ActivityList from "@/components/ActivityList";
import { ClientDetailSkeleton } from "@/components/skeletons";
import { useToastOptional } from "@/components/ToastProvider";
import { useClientModal } from "@/components/ClientModalProvider";
import { useProjectModal } from "@/components/ProjectModalProvider";
import { BackLink } from "@/components/ui/BackLink";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useActivity } from "@/lib/activityStore";
import {
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
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
  getClientById,
  restoreClientLocal,
  setClientStatusLocal,
} from "@/lib/clientsStore";
import {
  getCreatedProjects,
  PROJECTS_CHANGED,
} from "@/lib/createProject";
import { backgroundSync } from "@/lib/optimistic";
import type { ClientProject } from "@/data/clientsMock";

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

function projectLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "on-hold":
      return "On Hold";
    case "draft":
      return "Draft";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

function paymentLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "due":
    case "pending":
    case "partial":
      return "Unpaid";
    case "overdue":
      return "Past due";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function ClientMenu({
  open,
  onClose,
  onAction,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      items={[
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

type ClientDetailPageProps = {
  id: string;
};

export default function ClientDetailPage({ id }: ClientDetailPageProps) {
  const router = useRouter();
  const toast = useToastOptional();
  const { openCreate } = useProjectModal();
  const { openEdit } = useClientModal();
  const loading = useInitialLoading(420);
  const allActivity = useActivity();
  const [client, setClient] = useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const clientActivity = useMemo(() => {
    if (!client) return [];
    return allActivity.filter(
      (a) =>
        a.clientId === client.id ||
        a.clientName === client.name ||
        client.projects.some(
          (p) => p.slug === a.projectSlug || p.name === a.projectName,
        ),
    );
  }, [allActivity, client]);

  const load = () => {
    try {
      const found = getClientById(id);
      if (found) {
        const created = getCreatedProjects()
          .filter((p) => p.clientId === found.id)
          .map((p): ClientProject => {
            const done = p.tasks.filter((t) => t.done).length;
            const total = p.tasks.length;
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              progress: total ? Math.round((done / total) * 100) : 0,
              deadline: p.deadline
                ? new Date(p.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No deadline",
              value: p.value ?? 0,
              paymentStatus: "due",
              status: p.status,
            };
          });
        const existingIds = new Set(found.projects.map((p) => p.id));
        const merged = [
          ...created.filter((p) => !existingIds.has(p.id)),
          ...found.projects,
        ];
        setClient({ ...found, projects: merged });
        setMissing(false);
        setLoadError(false);
      } else {
        setClient(null);
        setMissing(true);
      }
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener(CLIENTS_CHANGED, onChange);
    window.addEventListener(PROJECTS_CHANGED, onChange);
    return () => {
      window.removeEventListener(CLIENTS_CHANGED, onChange);
      window.removeEventListener(PROJECTS_CHANGED, onChange);
    };
  }, [id]);

  const copyEmail = async () => {
    if (!client) return;
    try {
      await navigator.clipboard.writeText(client.email);
      toast?.success("Email copied");
    } catch {
      toast?.error("Couldn't copy the email.");
    }
  };

  const onMenuAction = (action: string) => {
    if (!client) return;
    if (action === "edit") {
      openEdit({
        clientId: client.id,
        onUpdated: (updated) => setClient(updated),
      });
      return;
    }
    if (action === "project") {
      openCreate({ clientId: client.id });
      return;
    }
    if (action === "copy-email") {
      void copyEmail();
      return;
    }
    if (action === "archive") {
      const prev = client;
      archiveClientLocal(client.id);
      setClient({ ...client, status: "inactive" });
      toast?.undo("Client archived", () => {
        setClientStatusLocal(prev.id, "active");
        setClient({ ...prev, status: "active" });
      });
      void backgroundSync().then((r) => {
        if (!r.ok) {
          setClientStatusLocal(prev.id, "active");
          setClient({ ...prev, status: "active" });
          toast?.error("Couldn't update the client. Try again.");
        }
      });
      return;
    }
    if (action === "delete") setDeleteOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar context="Clients" />
        <ClientDetailSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar context="Clients" />
        <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8">
          <div
            role="alert"
            className="card-surface flex flex-col items-start gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-ink">
                Couldn&apos;t load this client
              </p>
              <p className="mt-1 text-sm text-muted">
                Try again to view client details.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (missing || !client) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar context="Clients" />
        <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8">
          <BackLink href="/clients" label="Clients" />
          <p className="mt-6 text-sm text-muted">Client not found.</p>
        </div>
      </div>
    );
  }

  const stats = clientStats(client);
  const PROJECT_COLS =
    "lg:grid-cols-[minmax(0,1.4fr)_minmax(5rem,0.9fr)_7.5rem_5.5rem_6.5rem_6.5rem_auto]";

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar
        breadcrumb={[
          { label: "Clients", href: "/clients" },
          { label: client.company || client.name },
        ]}
      />

      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8">
        <BackLink href="/clients" label="Clients" />

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="page-title">{client.name}</h1>
              <StatusBadge
                label={clientStatusLabel(client.status)}
                tone={client.status === "active" ? "active" : "neutral"}
                icon={
                  client.status === "active"
                    ? projectStatusIcon("active")
                    : projectStatusIcon("archived")
                }
              />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {client.company || client.email}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                openEdit({
                  clientId: client.id,
                  onUpdated: (updated) => setClient(updated),
                })
              }
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              Edit Client
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Client actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex size-10 cursor-pointer items-center justify-center rounded-[8px] text-muted ${
                  menuOpen ? "bg-surface text-ink" : "hover-bg"
                }`}
              >
                <MoreHorizontal className="size-5" strokeWidth={1.75} />
              </button>
              <ClientMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onAction={onMenuAction}
              />
            </div>
          </div>
        </div>

        {/* Summary strip — Project Detail pattern */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Active Projects</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {stats.activeProjects}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Total Projects</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {stats.totalProjects}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Total Value</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {formatMoney(stats.totalValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Outstanding</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {formatMoney(client.outstanding)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-4">
            <h3 className="section-title">Client Information</h3>
            <div className="card-surface mt-4 overflow-hidden">
              <dl className="space-y-4 p-5">
                <div>
                  <dt className="text-xs text-muted">Name</dt>
                  <dd className="mt-0.5 text-sm text-ink">{client.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="mt-0.5 text-sm text-ink">{client.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Company</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {client.company || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Phone</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {client.phone || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">
                    Notes{" "}
                    <span className="font-normal">(private)</span>
                  </dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted">
                    {client.notes || "No notes yet."}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="flex flex-col gap-8 lg:col-span-8">
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="section-title">Projects</h3>
                <button
                  type="button"
                  onClick={() => openCreate({ clientId: client.id })}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-[8px] btn-accent px-3.5 text-sm font-semibold"
                >
                  <Plus className="size-3.5" strokeWidth={2.25} />
                  Create Project
                </button>
              </div>

              {client.projects.length === 0 ? (
                <div className="card-surface">
                  <EmptyState
                    icon={FolderKanban}
                    title="No projects yet"
                    description="This client doesn't have any projects yet."
                    action={{
                      label: "Create Project",
                      onClick: () => openCreate({ clientId: client.id }),
                      icon: Plus,
                    }}
                    compact
                  />
                </div>
              ) : (
                <div className="card-surface overflow-hidden">
                  <div
                    className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${PROJECT_COLS}`}
                  >
                    <span>Project</span>
                    <span>Progress</span>
                    <span>Deadline</span>
                    <span>Value</span>
                    <span>Payment</span>
                    <span>Status</span>
                    <span className="sr-only">Open</span>
                  </div>
                  <ul>
                    {client.projects.map((project) => {
                      const payKey =
                        project.paymentStatus === "partial"
                          ? "due"
                          : project.paymentStatus;
                      return (
                        <li
                          key={project.id}
                          className="border-b border-border last:border-0"
                        >
                          <div
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              const t = e.target as HTMLElement;
                              if (t.closest("a") || t.closest("button"))
                                return;
                              router.push(`/projects/${project.slug}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                router.push(`/projects/${project.slug}`);
                              }
                            }}
                            className={`grid cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent lg:gap-4 ${PROJECT_COLS}`}
                          >
                            <p className="truncate text-sm font-medium text-ink">
                              {project.name}
                            </p>
                            <div className="min-w-0">
                              <ProgressBar
                                value={project.progress}
                                meta={`${project.progress}%`}
                              />
                            </div>
                            <p className="truncate text-xs text-muted">
                              {project.deadline}
                            </p>
                            <p className="text-sm font-medium text-ink">
                              {formatMoney(project.value)}
                            </p>
                            <div>
                              <StatusBadge
                                label={paymentLabel(payKey)}
                                tone={paymentStatusTone(payKey)}
                                icon={paymentStatusIcon(payKey)}
                              />
                            </div>
                            <div>
                              <StatusBadge
                                label={projectLabel(project.status)}
                                tone={projectStatusTone(project.status)}
                                icon={projectStatusIcon(project.status)}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Link
                                href={`/projects/${project.slug}`}
                                data-hover-stop
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-9 cursor-pointer items-center rounded-[8px] btn-accent px-3.5 text-sm font-medium"
                              >
                                Open
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-3">
                <h3 className="section-title">Activity</h3>
                <Link
                  href={`/activity?client=${encodeURIComponent(client.name)}`}
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  View all
                </Link>
              </div>
              <div className="card-surface mt-4 overflow-hidden">
                <ActivityList
                  items={clientActivity}
                  limit={8}
                  showGroups={false}
                  compact
                  bare
                  emptyTitle="No activity yet"
                  emptyDescription="Client activity will appear here as work gets moving."
                />
              </div>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          const snapshot = client;
          deleteClientLocal(client.id);
          router.push("/clients");
          void backgroundSync().then((r) => {
            if (!r.ok) {
              restoreClientLocal(snapshot);
              toast?.error("Couldn't delete the client. Try again.");
              router.push(`/clients/${snapshot.id}`);
            }
          });
        }}
        title={`Delete ${client.name}?`}
        description="Deleting the client won't delete their projects."
        confirmLabel="Delete Client"
      />
    </div>
  );
}
