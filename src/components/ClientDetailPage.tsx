"use client";

import {
  Archive,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clientStats, type Client } from "@/data/clientsMock";
import {
  archiveClientLocal,
  deleteClientLocal,
  getClientById,
  restoreClientLocal,
} from "@/lib/clientsStore";
import { backgroundSync } from "@/lib/optimistic";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import DashboardTopBar from "./DashboardTopBar";
import { useToastOptional } from "./ToastProvider";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function projectStatusBadge(status: string) {
  if (status === "active")
    return { label: "Active", className: "bg-sky-500/15 text-sky-400" };
  if (status === "completed")
    return { label: "Completed", className: "bg-emerald-500/15 text-emerald-400" };
  return { label: "On hold", className: "bg-surface-strong text-muted" };
}

function ClientMenu({
  open,
  onClose,
  onEdit,
  onCreateProject,
  onArchive,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCreateProject: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    { id: "edit", label: "Edit Client", icon: Pencil, danger: false, fn: onEdit },
    {
      id: "project",
      label: "Create Project",
      icon: FolderKanban,
      danger: false,
      fn: onCreateProject,
    },
    {
      id: "archive",
      label: "Archive Client",
      icon: Archive,
      danger: false,
      fn: onArchive,
    },
    {
      id: "delete",
      label: "Delete Client",
      icon: Trash2,
      danger: true,
      fn: onDelete,
    },
  ] as const;

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => {
            item.fn();
            onClose();
          }}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover-soft ${
            item.danger ? "text-red-400 hover:text-red-300" : "text-ink"
          }`}
        >
          <item.icon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

type ClientDetailPageProps = {
  id: string;
};

export default function ClientDetailPage({ id }: ClientDetailPageProps) {
  const router = useRouter();
  const toast = useToastOptional();
  const [client, setClient] = useState<Client | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const found = getClientById(id);
    if (found) setClient(found);
    else setMissing(true);
  }, [id]);

  if (missing) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar context="Clients" />
        <div className="w-full flex-1 px-6 py-8 sm:px-8">
          <p className="text-sm text-muted">Client not found.</p>
          <Link
            href="/clients"
            className="mt-4 inline-flex text-sm font-medium text-ink hover:underline"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar context="Clients" />
        <div className="w-full flex-1 px-6 py-8 sm:px-8">
          <div className="auth-skeleton h-8 w-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = clientStats(client);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar
        breadcrumb={[
          { label: "Clients", href: "/clients" },
          { label: client.company || client.name },
        ]}
      />

      <div className="w-full flex-1 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {client.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="text-sm text-muted">{client.email}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${
                  client.status === "active"
                    ? "bg-sky-500/15 text-sky-400"
                    : "bg-surface-strong text-muted"
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {client.status}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
              Edit Client
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Client menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted ${
                  menuOpen ? "bg-surface text-ink" : "hover-soft-muted"
                }`}
              >
                <MoreHorizontal className="size-5" strokeWidth={1.75} />
              </button>
              <ClientMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onEdit={() => {}}
                onCreateProject={() => router.push("/projects/new")}
                onArchive={() => {
                  const prev = client;
                  archiveClientLocal(client.id);
                  setClient({ ...client, status: "inactive" });
                  toast?.undo("Client archived", () => {
                    restoreClientLocal({ ...prev, status: "active" });
                    setClient({ ...prev, status: "active" });
                  });
                  void backgroundSync().then((r) => {
                    if (!r.ok) {
                      restoreClientLocal({ ...prev, status: "active" });
                      setClient({ ...prev, status: "active" });
                      toast?.error("Couldn't update client.");
                    }
                  });
                }}
                onDelete={() => setDeleteOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* Overview stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Active Projects", value: String(stats.activeProjects) },
            { label: "Total Projects", value: String(stats.totalProjects) },
            { label: "Total Value", value: formatMoney(stats.totalValue) },
            { label: "Outstanding", value: formatMoney(client.outstanding) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card px-5 py-4"
            >
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="mt-2 font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {/* Client information */}
          <section className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-ink">
                  Client Information
                </h3>
                <button
                  type="button"
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  Edit
                </button>
              </div>
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
                    <span className="text-muted">(private)</span>
                  </dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted">
                    {client.notes || "No notes yet."}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Projects + Activity */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-ink">Projects</h3>
              </div>
              {client.projects.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-muted">
                    No projects yet for this client.
                  </p>
                  <Link
                    href="/projects/new"
                    className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-xl btn-accent px-4 text-sm font-semibold"
                  >
                    Create Project
                  </Link>
                </div>
              ) : (
                <ul>
                  {client.projects.map((project, i) => {
                    const badge = projectStatusBadge(project.status);
                    return (
                      <li
                        key={project.id}
                        className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                          i < client.projects.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-ink">
                              {project.name}
                            </p>
                            <span
                              className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                            <span>Progress: {project.progress}%</span>
                            <span>
                              {project.status === "completed" &&
                              project.completedAt
                                ? `Completed ${project.completedAt}`
                                : `Deadline: ${project.deadline}`}
                            </span>
                            <span>{formatMoney(project.value)}</span>
                          </div>
                          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface">
                            <div
                              className="h-full rounded-full bg-ink"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <Link
                          href={`/projects/${project.slug}`}
                          className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-xl bg-surface px-4 text-xs font-medium text-ink hover-soft"
                        >
                          Open Project
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-ink">Activity</h3>
              </div>
              <ul className="divide-y divide-border">
                {client.activity.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-4 px-5 py-3.5"
                  >
                    <p className="text-sm text-ink">{item.text}</p>
                    <span className="shrink-0 text-xs text-muted">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (!client) return;
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
        title="Delete this client?"
        description="Deleting the client won't delete their projects."
        confirmLabel="Delete Client"
      />
    </div>
  );
}
