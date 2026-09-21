"use client";

import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  CreditCard,
  FileText,
  FolderKanban,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type ActiveProject,
  type NeedsAttentionItem,
  type PaymentStatus,
  type ProjectStatus,
  type RecentPayment,
} from "@/data/dashboardMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { appendActivity, useActivity } from "@/lib/activityStore";
import {
  getCreatedProjects,
  getCreatedProjectById,
  getCreatedProjectBySlug,
  PROJECTS_CHANGED,
  type CreatedProject,
} from "@/lib/createProject";
import { CLIENTS_CHANGED, getAllClients } from "@/lib/clientsStore";
import { backgroundSync } from "@/lib/optimistic";
import {
  WORKSPACE_CHANGED,
} from "@/lib/workspaceStore";
import ContextMenu from "./ContextMenu";
import MenuDropdown from "./MenuDropdown";
import { useAuth } from "./AuthProvider";
import ActivityList from "./ActivityList";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import DashboardTopBar from "./DashboardTopBar";
import EmptyState from "./EmptyState";
import { DashboardSkeleton } from "./skeletons";
import { useToastOptional } from "./ToastProvider";
import { useProjectModal } from "./ProjectModalProvider";
import { useClientModal } from "./ClientModalProvider";
import { ProgressBar } from "./ui/ProgressBar";
import {
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  StatusBadge,
} from "./ui/StatusBadge";

type SortKey =
  | "updated"
  | "deadline"
  | "created"
  | "name-asc"
  | "name-desc"
  | "value-desc"
  | "value-asc";

type FilterKey =
  | "all"
  | "active"
  | "draft"
  | "on-hold"
  | "completed"
  | "archived";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "updated", label: "Recently updated" },
  { id: "deadline", label: "Deadline soonest" },
  { id: "created", label: "Recently created" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "value-desc", label: "Highest value" },
  { id: "value-asc", label: "Lowest value" },
];

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "on-hold", label: "On Hold" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Color for financial amounts only — never badges or labels. */
function moneyToneClass(status?: string | null) {
  switch (status) {
    case "paid":
    case "collected":
      return "text-success";
    case "due":
    case "pending":
    case "partial":
    case "outstanding":
      return "text-warning";
    case "overdue":
    case "failed":
      return "text-danger";
    case "processing":
    case "sent":
      return "text-info";
    default:
      return "text-ink";
  }
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function paymentLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "due":
    case "pending":
      return "Due";
    case "partial":
      return "Partial";
    case "overdue":
      return "Overdue";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
  }
}

function projectLabel(status: ProjectStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "on-hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    case "review":
      return "Active";
  }
}

function SectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}

function SectionError({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[8px] border border-border bg-card px-3.5 text-sm font-medium text-ink outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        Retry
      </button>
    </div>
  );
}

function attentionIcon(kind: NeedsAttentionItem["kind"]) {
  switch (kind) {
    case "message":
      return MessageSquare;
    case "approval":
      return CircleAlert;
    case "waiting":
      return Clock;
    case "changes":
      return Pencil;
    case "followup":
      return UserPlus;
  }
}

function InvoiceMenu({
  open,
  onClose,
  onAction,
  showMarkPaid,
  position,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  showMarkPaid?: boolean;
  position: { x: number; y: number } | null;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      position={position}
      clampHeight={260}
      items={[
        { id: "view", label: "View Invoice", icon: FileText },
        { id: "edit", label: "Edit Invoice", icon: Pencil },
        { id: "copy", label: "Copy Payment Link", icon: Link2 },
        {
          id: "paid",
          label: "Mark as Paid",
          icon: Check,
          hidden: !showMarkPaid,
        },
        { id: "delete", label: "Delete Invoice", icon: Trash2, danger: true },
      ]}
    />
  );
}

function ProjectMenu({
  open,
  onClose,
  onAction,
  position,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  position?: { x: number; y: number } | null;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      position={position}
      clampHeight={220}
      items={[
        { id: "open", label: "Open Project", icon: FolderKanban },
        { id: "edit", label: "Edit Project", icon: Pencil },
        { id: "copy", label: "Copy Portal Link", icon: Copy },
        { id: "archive", label: "Archive", icon: Archive },
        { id: "delete", label: "Delete", icon: Trash2, danger: true },
      ]}
    />
  );
}

function NewWorkspace({
  firstName,
  onCreateProject,
}: {
  firstName: string;
  onCreateProject: () => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-[12px] bg-accent-soft text-ink">
        <Sparkles className="size-6" strokeWidth={1.75} />
      </div>
      <h2 className="page-title">Your workspace is ready.</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Create your first project to start organizing your work and giving
        clients a simple place to follow progress.
        {firstName ? ` Welcome, ${firstName}.` : ""}
      </p>
      <button
        type="button"
        onClick={onCreateProject}
        className="mt-8 inline-flex h-11 cursor-pointer items-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold"
      >
        <Plus className="size-4" strokeWidth={2.25} />
        Create First Project
      </button>
    </div>
  );
}

type FreelancerDashboardProps = {
  onSignUpOpen?: () => void;
};

export default function FreelancerDashboard({
  onSignUpOpen,
}: FreelancerDashboardProps) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const toast = useToastOptional();
  const { openCreate, openEdit } = useProjectModal();
  const { openAdd } = useClientModal();
  const loading = useInitialLoading(420);
  const activity = useActivity();
  const [projects, setProjects] = useState<ActiveProject[]>([]);
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [attention] = useState<NeedsAttentionItem[]>([]);
  const [paymentStats, setPaymentStats] = useState({
    outstanding: 0,
    outstandingInvoices: 0,
    collected: 0,
    collectedPeriod: "This month",
  });
  const [clientCount, setClientCount] = useState(0);
  const [paymentsError, setPaymentsError] = useState(false);
  const [activityError, setActivityError] = useState(false);
  const [invoiceMenuId, setInvoiceMenuId] = useState<string | null>(null);
  const [invoiceMenuPos, setInvoiceMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [sort, setSort] = useState<SortKey>("updated");
  const [filter, setFilter] = useState<FilterKey>("active");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ActiveProject | null>(null);

  useEffect(() => {
    const mergeCreated = () => {
      const created = getCreatedProjects();
      const mapped: ActiveProject[] = created.map((p: CreatedProject) => {
        const done = p.tasks.filter((t) => t.done).length;
        const total = p.tasks.length;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        const currentTask =
          p.tasks.find((t) => !t.done)?.name ||
          (total > 0 ? "All tasks complete" : "No tasks yet");
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          client: p.clientName,
          progress,
          currentTask,
          deadlineAt: p.deadline || "",
          deadlineLabel: p.deadline ? "Deadline set" : "No deadline",
          value: p.value ?? 0,
          paid: 0,
          paymentStatus: "due" as const,
          status: p.status,
          updatedAt: p.createdAt,
          createdAt: p.createdAt,
        };
      });
      setProjects(mapped);
    };
    mergeCreated();
    const syncClients = () => setClientCount(getAllClients().length);
    syncClients();
    window.addEventListener(PROJECTS_CHANGED, mergeCreated);
    window.addEventListener(CLIENTS_CHANGED, syncClients);
    window.addEventListener(WORKSPACE_CHANGED, mergeCreated);
    window.addEventListener(WORKSPACE_CHANGED, syncClients);
    return () => {
      window.removeEventListener(PROJECTS_CHANGED, mergeCreated);
      window.removeEventListener(CLIENTS_CHANGED, syncClients);
      window.removeEventListener(WORKSPACE_CHANGED, mergeCreated);
      window.removeEventListener(WORKSPACE_CHANGED, syncClients);
    };
  }, []);

  const closeMenu = () => {
    setMenuId(null);
    setMenuPos(null);
  };

  const firstName =
    (
      profile?.display_name ||
      profile?.username ||
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      "Alex"
    )
      .trim()
      .split(/\s+/)[0] || "Alex";

  const greeting = greetingForHour(new Date().getHours());

  const filtered = useMemo(() => {
    let list = [...projects];
    if (filter !== "all") {
      list = list.filter((p) => {
        if (filter === "active")
          return p.status === "active" || p.status === "review";
        return p.status === filter;
      });
    }
    list.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "value-desc") return b.value - a.value;
      if (sort === "value-asc") return a.value - b.value;
      if (sort === "deadline")
        return a.deadlineAt.localeCompare(b.deadlineAt);
      if (sort === "created")
        return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return list;
  }, [projects, filter, sort]);

  const activeCount = projects.filter(
    (p) => p.status === "active" || p.status === "review",
  ).length;

  const copyPortalLink = async (project: ActiveProject) => {
    const link = `${window.location.origin}/p/${project.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      toast?.success("Portal link copied");
    } catch {
      toast?.error("Couldn't copy the portal link.");
    }
  };

  const archiveProject = (project: ActiveProject) => {
    const prev = projects;
    setProjects((list) =>
      list.map((p) =>
        p.id === project.id ? { ...p, status: "archived" as const } : p,
      ),
    );
    toast?.undo("Project archived", () => setProjects(prev));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't update the project. Try again.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const prev = projects;
    setProjects((list) => list.filter((p) => p.id !== target.id));
    toast?.undo("Project deleted", () => setProjects(prev));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't delete the project. Try again.");
      }
    });
  };

  const onMenuAction = (project: ActiveProject, action: string) => {
    if (action === "open") {
      router.push(`/projects/${project.slug}`);
      return;
    }
    if (action === "edit") {
      const created =
        getCreatedProjectById(project.id) ||
        getCreatedProjectBySlug(project.slug);
      openEdit({
        initial: {
          id: project.id,
          name: project.name,
          clientId: created?.clientId ?? null,
          clientName: created?.clientName ?? project.client,
          clientEmail: created?.clientEmail ?? "",
          description: created?.description ?? "",
          value: created?.value ?? project.value,
          currency: created?.currency ?? "USD",
          deadline: created?.deadline ?? project.deadlineAt ?? "",
          status: (created?.status ??
            (project.status === "review" ? "active" : project.status)) as
            | "active"
            | "draft"
            | "on-hold"
            | "completed"
            | "archived",
          tasks: created?.tasks ?? [],
        },
        onSuccess: (values) => {
          setProjects((list) =>
            list.map((p) =>
              p.id === project.id
                ? {
                    ...p,
                    name: values.name,
                    client: values.clientName,
                    value: values.value ?? 0,
                    status: values.status,
                    deadlineAt: values.deadline || p.deadlineAt,
                    deadlineLabel: values.deadline
                      ? "Deadline set"
                      : "No deadline",
                    progress:
                      values.tasks.length === 0
                        ? 0
                        : Math.round(
                            (values.tasks.filter((t) => t.done).length /
                              values.tasks.length) *
                              100,
                          ),
                  }
                : p,
            ),
          );
        },
      });
      return;
    }
    if (action === "copy") {
      void copyPortalLink(project);
      return;
    }
    if (action === "archive") {
      archiveProject(project);
      return;
    }
    if (action === "delete") {
      setDeleteTarget(project);
    }
  };

  const markInvoicePaid = (payment: RecentPayment) => {
    if (payment.status === "paid") return;

    const prevPayments = payments;
    const prevStats = paymentStats;
    const undoActivity = appendActivity({
      id: `paid-${payment.id}-${Date.now()}`,
      description: `Invoice ${payment.invoice} was paid`,
      context: `${payment.client} · ${payment.project}`,
      category: "invoices",
      href: payment.href,
      actorKind: "client",
      actorName: payment.client,
      projectName: payment.project,
      clientName: payment.client,
      amount: `$${payment.amount.toLocaleString()}`,
      paymentStatus: "paid",
    });

    setPayments((list) =>
      list.map((p) =>
        p.id === payment.id
          ? {
              ...p,
              status: "paid" as const,
              dateLabel: "Paid" as const,
              date: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
            }
          : p,
      ),
    );
    setPaymentStats((s) => ({
      ...s,
      outstanding: Math.max(0, s.outstanding - payment.amount),
      outstandingInvoices: Math.max(0, s.outstandingInvoices - 1),
      collected: s.collected + payment.amount,
    }));

    void backgroundSync().then((r) => {
      if (!r.ok) {
        setPayments(prevPayments);
        setPaymentStats(prevStats);
        undoActivity();
        toast?.error("Couldn't update the invoice. Try again.");
      }
    });
  };

  const deleteInvoice = (payment: RecentPayment) => {
    const prevPayments = payments;
    const prevStats = paymentStats;
    const wasUnpaid = payment.status !== "paid";

    setPayments((list) => list.filter((p) => p.id !== payment.id));
    if (wasUnpaid) {
      setPaymentStats((s) => ({
        ...s,
        outstanding: Math.max(0, s.outstanding - payment.amount),
        outstandingInvoices: Math.max(0, s.outstandingInvoices - 1),
      }));
    }

    void backgroundSync().then((r) => {
      if (!r.ok) {
        setPayments(prevPayments);
        setPaymentStats(prevStats);
        toast?.error("Couldn't delete the invoice. Try again.");
      }
    });
  };

  const onInvoiceAction = (payment: RecentPayment, action: string) => {
    if (action === "view" || action === "edit") {
      router.push(payment.href);
      return;
    }
    if (action === "copy") {
      void (async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/pay/${payment.invoice}`,
          );
          toast?.success("Payment link copied");
        } catch {
          toast?.error("Couldn't copy the payment link.");
        }
      })();
      return;
    }
    if (action === "paid") {
      markInvoicePaid(payment);
      return;
    }
    if (action === "delete") {
      deleteInvoice(payment);
    }
  };

  const retryPayments = () => {
    setPaymentsError(false);
    setPayments([]);
    setPaymentStats({
      outstanding: 0,
      outstandingInvoices: 0,
      collected: 0,
      collectedPeriod: "This month",
    });
  };

  const retryActivity = () => {
    setActivityError(false);
  };

  const isEmptyWorkspace = projects.length === 0 && clientCount === 0;

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar onSignUpOpen={onSignUpOpen} />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {isEmptyWorkspace ? (
            <NewWorkspace firstName={firstName} onCreateProject={openCreate} />
          ) : (
            <>
              {/* Header */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="page-title">
                    {greeting}, {firstName}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted">
                    Here&apos;s what&apos;s happening across your projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold sm:self-auto"
                >
                  <Plus className="size-4" strokeWidth={2.25} />
                  New Project
                </button>
              </div>

              {/* Summary */}
              <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {(
                  [
                    {
                      label: "Active Projects",
                      value: String(activeCount),
                      support: `0 due this week`,
                      href: "/projects",
                      valueClass: "text-ink",
                    },
                    {
                      label: "Total Clients",
                      value: String(clientCount),
                      support: `${clientCount} total`,
                      href: "/clients",
                      valueClass: "text-ink",
                    },
                    {
                      label: "Outstanding",
                      value: formatMoney(paymentStats.outstanding),
                      support: `${paymentStats.outstandingInvoices} invoices`,
                      href: "/projects",
                      valueClass: moneyToneClass("outstanding"),
                    },
                    {
                      label: "Collected",
                      value: formatMoney(paymentStats.collected),
                      support: paymentStats.collectedPeriod,
                      href: "/projects",
                      valueClass: moneyToneClass("collected"),
                    },
                  ] as const
                ).map((stat) => (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="card-surface-interactive block px-5 py-4"
                  >
                    <p className="text-xs font-medium text-muted">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-2 text-2xl font-semibold tracking-tight ${stat.valueClass}`}
                    >
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-soft">
                      {stat.support}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Active Projects — primary */}
              <div className="mb-8">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="section-title">Active Projects</h2>
                    <Link
                      href="/projects"
                      className="text-sm font-medium text-muted hover:text-ink"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilter(f.id)}
                          className={`h-8 cursor-pointer rounded-[8px] px-3 text-xs font-medium transition-colors ${
                            filter === f.id
                              ? "bg-accent-soft text-ink"
                              : "text-muted hover:bg-surface-hover hover:text-ink"
                          }`}
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
                      widthLabel="Sort: Deadline soonest"
                    />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="card-surface">
                    <EmptyState
                      icon={FolderKanban}
                      title={
                        filter === "active"
                          ? "No active projects"
                          : `No ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase() ?? ""} projects`
                      }
                      description={
                        filter === "active"
                          ? "Create your first project to start managing work and sharing a client portal."
                          : "Projects matching this filter will appear here."
                      }
                      action={
                        filter === "active"
                          ? {
                              label: "Create Project",
                              onClick: () => openCreate(),
                              icon: Plus,
                            }
                          : undefined
                      }
                      compact
                    />
                  </div>
                ) : (
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {filtered.map((project) => {
                      const overdue =
                        project.deadlineLabel.toLowerCase().includes("overdue");
                      const openProject = () =>
                        router.push(`/projects/${project.slug}`);
                      return (
                        <li
                          key={project.id}
                          role="link"
                          tabIndex={0}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (
                              target.closest("button") ||
                              target.closest("a") ||
                              target.closest("[role='menu']")
                            ) {
                              return;
                            }
                            openProject();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openProject();
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setMenuId(project.id);
                            setMenuPos({ x: e.clientX, y: e.clientY });
                          }}
                          className="card-surface-interactive flex cursor-pointer flex-col p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[15px] font-semibold text-ink">
                                  {project.name}
                                </h3>
                                <StatusBadge
                                  label={projectLabel(project.status)}
                                  tone={projectStatusTone(project.status)}
                                  icon={projectStatusIcon(project.status)}
                                />
                                <StatusBadge
                                  label={paymentLabel(
                                    project.paymentStatus === "partial"
                                      ? "due"
                                      : project.paymentStatus,
                                  )}
                                  tone={paymentStatusTone(
                                    project.paymentStatus === "partial"
                                      ? "due"
                                      : project.paymentStatus,
                                  )}
                                  icon={paymentStatusIcon(
                                    project.paymentStatus === "partial"
                                      ? "due"
                                      : project.paymentStatus,
                                  )}
                                />
                                {overdue &&
                                project.paymentStatus !== "overdue" ? (
                                  <StatusBadge
                                    label="Overdue"
                                    tone="danger"
                                    icon={paymentStatusIcon("overdue")}
                                  />
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-muted">
                                {project.client}
                              </p>
                            </div>
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                aria-label="Project actions"
                                aria-expanded={menuId === project.id && !menuPos}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (menuId === project.id && !menuPos) {
                                    closeMenu();
                                  } else {
                                    setMenuId(project.id);
                                    setMenuPos(null);
                                  }
                                }}
                                data-hover-stop
                                className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </button>
                              {menuId === project.id && !menuPos ? (
                                <ProjectMenu
                                  open
                                  onClose={closeMenu}
                                  onAction={(a) => onMenuAction(project, a)}
                                />
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-4">
                            <ProgressBar
                              value={project.progress}
                              meta={`${project.progress}% · ${project.currentTask}`}
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                            <span
                              className={
                                overdue ? "font-medium text-danger" : ""
                              }
                            >
                              {project.deadlineLabel}
                            </span>
                            <span className="text-ink">
                              {formatMoney(project.value)}
                            </span>
                            <span>
                              <span className={moneyToneClass("paid")}>
                                {formatMoney(project.paid)}
                              </span>{" "}
                              paid
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                            <button
                              type="button"
                              aria-label="Copy portal link"
                              onClick={(e) => {
                                e.stopPropagation();
                                void copyPortalLink(project);
                              }}
                              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium text-muted hover-soft"
                            >
                              <Copy className="size-3.5" strokeWidth={1.75} />
                              Copy link
                            </button>
                            <Link
                              href={`/projects/${project.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 cursor-pointer items-center rounded-[8px] btn-primary px-3.5 text-sm font-medium"
                            >
                              Open
                            </Link>
                          </div>

                          {menuId === project.id && menuPos ? (
                            <ProjectMenu
                              open
                              position={menuPos}
                              onClose={closeMenu}
                              onAction={(a) => onMenuAction(project, a)}
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Payments + Needs Attention — equal width */}
              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <div className="min-w-0">
                  <SectionHead
                    title="Payments"
                    description="Keep track of what's due and what you've collected."
                    action={
                      <Link
                        href="/billing"
                        className="text-sm font-medium text-muted hover:text-ink"
                      >
                        View all
                      </Link>
                    }
                  />
                  <div className="card-surface overflow-hidden">
                    {paymentsError ? (
                      <SectionError
                        title="Payments couldn't be loaded"
                        description="Try again to view your latest payment information."
                        onRetry={retryPayments}
                      />
                    ) : payments.length === 0 ? (
                      <EmptyState
                        icon={CreditCard}
                        title="No payments yet"
                        description="Create your first invoice to start tracking project payments."
                        action={{
                          label: "Create Invoice",
                          href: "/projects",
                          icon: Plus,
                        }}
                        compact
                      />
                    ) : (
                      <>
                        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                          <div className="px-5 py-4">
                            <p className="text-xs font-medium text-muted">
                              Outstanding
                            </p>
                            <p
                              className={`mt-1.5 text-xl font-semibold tracking-tight ${moneyToneClass("outstanding")}`}
                            >
                              {formatMoney(paymentStats.outstanding)}
                            </p>
                            <p className="mt-1 text-xs text-muted-soft">
                              Across {paymentStats.outstandingInvoices}{" "}
                              invoices
                            </p>
                          </div>
                          <div className="px-5 py-4">
                            <p className="text-xs font-medium text-muted">
                              Collected
                            </p>
                            <p
                              className={`mt-1.5 text-xl font-semibold tracking-tight ${moneyToneClass("collected")}`}
                            >
                              {formatMoney(paymentStats.collected)}
                            </p>
                            <p className="mt-1 text-xs text-muted-soft">
                              {paymentStats.collectedPeriod}
                            </p>
                          </div>
                        </div>

                        <ul>
                          {payments.map((p) => (
                            <li
                              key={p.id}
                              className="group relative border-b border-border last:border-0"
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setInvoiceMenuId(p.id);
                                setInvoiceMenuPos({
                                  x: e.clientX,
                                  y: e.clientY,
                                });
                              }}
                            >
                              <div className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent">
                                <button
                                  type="button"
                                  onClick={() => router.push(p.href)}
                                  className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-ink">
                                      {p.invoice} — {p.project}
                                    </p>
                                    <StatusBadge
                                      label={paymentLabel(p.status)}
                                      tone={paymentStatusTone(p.status)}
                                      icon={paymentStatusIcon(p.status)}
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-muted">
                                    {p.client} ·{" "}
                                    <span className={moneyToneClass(p.status)}>
                                      {formatMoney(p.amount)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-soft">
                                    {p.dateLabel} {p.date}
                                  </p>
                                </button>
                                <div className="relative shrink-0">
                                  <button
                                    type="button"
                                    data-hover-stop
                                    aria-label={`Invoice actions for ${p.invoice}`}
                                    aria-expanded={invoiceMenuId === p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (invoiceMenuId === p.id) {
                                        setInvoiceMenuId(null);
                                        setInvoiceMenuPos(null);
                                        return;
                                      }
                                      const rect = (
                                        e.currentTarget as HTMLButtonElement
                                      ).getBoundingClientRect();
                                      setInvoiceMenuId(p.id);
                                      setInvoiceMenuPos({
                                        x: rect.right - 208,
                                        y: rect.bottom + 6,
                                      });
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setInvoiceMenuId(p.id);
                                      setInvoiceMenuPos({
                                        x: e.clientX,
                                        y: e.clientY,
                                      });
                                    }}
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20"
                                  >
                                    <MoreHorizontal
                                      className="size-4"
                                      strokeWidth={1.75}
                                    />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <SectionHead
                    title="Needs Attention"
                    description="A few things may need your attention."
                    action={
                      attention.length > 0 ? (
                        <span className="text-sm font-medium text-muted">
                          {attention.length}{" "}
                          {attention.length === 1 ? "item" : "items"}
                        </span>
                      ) : undefined
                    }
                  />
                  <div className="card-surface overflow-hidden">
                    {attention.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
                          <CheckCircle2
                            className="size-5"
                            strokeWidth={1.75}
                          />
                        </div>
                        <h3 className="text-sm font-semibold text-ink">
                          You&apos;re all caught up
                        </h3>
                        <p className="mt-1.5 max-w-sm text-sm text-muted">
                          There&apos;s nothing from your clients that needs
                          your attention right now.
                        </p>
                      </div>
                    ) : (
                      <ul>
                        {attention.map((item) => {
                          const Icon = attentionIcon(item.kind);
                          return (
                            <li
                              key={item.id}
                              className="border-b border-border last:border-0"
                            >
                              <div className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent">
                                <span
                                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] ${
                                    item.tone === "problem"
                                      ? "bg-danger-soft text-danger"
                                      : item.tone === "attention"
                                        ? "bg-warning-soft text-warning"
                                        : "bg-surface text-muted"
                                  }`}
                                >
                                  <Icon
                                    className="size-4"
                                    strokeWidth={1.75}
                                  />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => router.push(item.href)}
                                  className="min-w-0 flex-1 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                                >
                                  <p className="text-sm font-medium text-ink">
                                    {item.title}
                                  </p>
                                  <p className="mt-1 text-xs text-muted">
                                    {item.context}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-soft">
                                    {item.time}
                                  </p>
                                </button>
                                <Link
                                  href={item.href}
                                  data-hover-stop
                                  className="shrink-0 pt-0.5 text-sm font-medium text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                                >
                                  {item.actionLabel}
                                </Link>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity — full width */}
              <div className="mb-8">
                <SectionHead
                  title="Recent Activity"
                  description="See what's been happening across your workspace."
                  action={
                    <Link
                      href="/activity"
                      className="text-sm font-medium text-muted hover:text-ink"
                    >
                      View all
                    </Link>
                  }
                />
                <div className="card-surface overflow-hidden">
                  {activityError ? (
                    <SectionError
                      title="Activity couldn't be loaded"
                      description="Try again to see the latest workspace activity."
                      onRetry={retryActivity}
                    />
                  ) : (
                    <ActivityList
                      items={activity}
                      limit={6}
                      showGroups={false}
                      compact
                      bare
                      emptyTitle="No activity yet"
                      emptyDescription="Project and client activity will appear here as your workspace gets moving."
                    />
                  )}
                </div>
              </div>

              {/* Quick Actions — one centered row */}
              <div className="mb-2">
                <SectionHead
                  title="Quick Actions"
                  description="Get things done without leaving your Dashboard."
                />
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => openCreate()}
                    className="group flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-3.5 text-left outline-none transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                      <FolderKanban className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        New Project
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        Set up a project and invite your client.
                      </span>
                    </span>
                    <ArrowRight
                      className="size-5 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => openAdd()}
                    className="group flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-3.5 text-left outline-none transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                      <UserPlus className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        Add Client
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        Add a client to your workspace.
                      </span>
                    </span>
                    <ArrowRight
                      className="size-5 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  </button>
                  <Link
                    href="/projects"
                    className="group flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-3.5 outline-none transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                      <FileText className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        Create Invoice
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">
                        Create and share a project invoice.
                      </span>
                    </span>
                    <ArrowRight
                      className="size-5 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget
            ? `Delete ${deleteTarget.name}?`
            : "Delete this project?"
        }
        description="This permanently removes the project and its associated project data."
        confirmLabel="Delete Project"
      />

      {invoiceMenuId && invoiceMenuPos ? (
        <InvoiceMenu
          open
          position={invoiceMenuPos}
          showMarkPaid={
            payments.find((p) => p.id === invoiceMenuId)?.status !== "paid"
          }
          onClose={() => {
            setInvoiceMenuId(null);
            setInvoiceMenuPos(null);
          }}
          onAction={(a) => {
            const payment = payments.find((p) => p.id === invoiceMenuId);
            if (payment) onInvoiceAction(payment, a);
            setInvoiceMenuId(null);
            setInvoiceMenuPos(null);
          }}
        />
      ) : null}
    </div>
  );
}
