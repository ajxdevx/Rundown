"use client";

import {
  Archive,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileArchive,
  FileImage,
  FileText,
  FolderKanban,
  GripVertical,
  LayoutGrid,
  LayoutList,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  emptyProjectDetail,
  type ProjectActivity,
  type ProjectDetail,
  type ProjectFile,
  type ProjectInvoice,
  type ProjectMessage,
  type ProjectStatus,
  type ProjectTask,
  type ProjectTaskStatus,
} from "@/data/projectDetailMock";
import {
  seedProjectFiles,
  seedProjectFinance,
  seedProjectInvoices,
  seedProjectMessages,
} from "@/data/seedWorkspace";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import {
  buildCreatedProject,
  commitCreatedProject,
  getCreatedProjectBySlug,
  removeCreatedProject,
  restoreCreatedProject,
} from "@/lib/createProject";
import { appendActivity, useActivity } from "@/lib/activityStore";
import { backgroundSync } from "@/lib/optimistic";
import { useProjectModal } from "@/components/ProjectModalProvider";
import { AppCheckbox } from "@/components/ui/AppCheckbox";
import type { ProjectFormEditValues } from "@/components/ProjectFormModal";
import { deadlineLabelFromIso, deadlineToneClass, deadlineToneSurface } from "@/lib/deadlineLabel";
import ActivityList from "./ActivityList";
import ClientVisibleToggle from "./ClientVisibleToggle";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ContextMenu from "./ContextMenu";
import DashboardTopBar from "./DashboardTopBar";
import Dropdown from "./Dropdown";
import { ProjectNotFound } from "./EdgeStates";
import EmptyState from "./EmptyState";
import Popup, { PopupCloseButton } from "./Popup";
import { ProjectDetailSkeleton } from "./skeletons";
import { useToastOptional } from "./ToastProvider";
import { ProgressBar } from "./ui/ProgressBar";
import {
  paymentStatusIcon,
  paymentStatusLabel,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  taskStatusIcon,
  taskStatusLabel,
  taskStatusTone,
  StatusBadge,
} from "./ui/StatusBadge";
import MenuDropdown from "./MenuDropdown";

type TabId = "overview" | "tasks" | "files" | "invoices" | "messages";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
  { id: "invoices", label: "Invoices" },
  { id: "messages", label: "Messages" },
];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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

function paymentLabel(state: ProjectDetail["paymentState"]) {
  return paymentStatusLabel(state);
}

function portalDisplayPath(portalUrl: string) {
  try {
    if (portalUrl.startsWith("http")) {
      const u = new URL(portalUrl);
      return `dueso.app${u.pathname}`;
    }
  } catch {
    /* fall through */
  }
  const path = portalUrl.startsWith("/") ? portalUrl : `/${portalUrl}`;
  return `dueso.app${path}`;
}

function paymentMetricLabel(
  remaining: number,
  state: ProjectDetail["paymentState"],
  currency: string,
) {
  if (state === "paid" || remaining <= 0) {
    return "Paid";
  }
  return `${formatMoney(remaining, currency)} ${paymentLabel(state)}`;
}

function derivePaymentState(
  invoices: ProjectInvoice[],
  remaining: number,
): ProjectDetail["paymentState"] {
  if (invoices.some((i) => i.status === "failed")) return "failed";
  if (invoices.some((i) => i.status === "processing")) return "processing";
  if (invoices.some((i) => i.status === "overdue")) return "overdue";
  if (remaining <= 0) return "paid";
  return "due";
}

function fileIcon(type: ProjectFile["type"]) {
  if (type === "ZIP") return FileArchive;
  if (type === "IMG") return FileImage;
  return FileText;
}

function notifyProjectsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("dueso:projects-changed"));
}

function statusLabel(status: ProjectStatus) {
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
  }
}

function progressFromTasks(tasks: ProjectTask[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return {
    done,
    total,
    progress: total ? Math.round((done / total) * 100) : 0,
  };
}

function ProjectMenu({
  open,
  onClose,
  onAction,
  showComplete,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  showComplete: boolean;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      widthClass="w-56"
      items={[
        { id: "edit", label: "Edit Project", icon: Pencil },
        { id: "duplicate", label: "Duplicate Project", icon: Copy },
        { id: "copy", label: "Copy Portal Link", icon: Copy },
        {
          id: "complete",
          label: "Mark as Completed",
          icon: Check,
          hidden: !showComplete,
        },
        {
          id: "archive",
          label: "Archive Project",
          icon: Archive,
          dividerBefore: true,
        },
        { id: "delete", label: "Delete Project", icon: Trash2, danger: true },
      ]}
    />
  );
}

function dueLabel(relative: string) {
  if (relative === "No deadline") return "No deadline";
  if (relative.startsWith("In ")) return `Due ${relative.toLowerCase()}`;
  if (relative === "Tomorrow") return "Due tomorrow";
  if (relative === "Today") return "Due today";
  return relative;
}

function OverviewSectionHead({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3">
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

function OverviewTab({
  project,
  tasks,
  invoices,
  onGoTasks,
  onOpenTask,
  onGoInvoices,
  onCopyLink,
  onOpenPortal,
}: {
  project: ProjectDetail;
  tasks: ProjectTask[];
  invoices: ProjectInvoice[];
  onGoTasks: () => void;
  onOpenTask: (id: string) => void;
  onGoInvoices: () => void;
  onCopyLink: () => void;
  onOpenPortal: () => void;
}) {
  const allActivity = useActivity();
  const activity = useMemo(
    () =>
      allActivity.filter(
        (a) =>
          a.projectSlug === project.slug ||
          a.projectName === project.name ||
          a.projectId === project.id,
      ),
    [allActivity, project.slug, project.name, project.id],
  );
  const { done, total, progress } = progressFromTasks(tasks);
  const remainingTasks = Math.max(0, total - done);
  const nextTask = tasks.find((t) => !t.done) ?? null;
  const visibleTasks = tasks.filter((t) => t.visibleToClient).length;
  const outstandingInvoices = invoices.filter(
    (i) => i.status !== "paid",
  ).length;
  const recentInvoices = invoices.slice(0, 4);
  const clientCanSee = [
    "Project progress",
    visibleTasks > 0 ? "Visible tasks" : null,
    "Client-visible files",
    "Payment information",
    "Messages",
  ].filter(Boolean) as string[];

  const infoFields: { label: string; value: ReactNode }[] = [
    {
      label: "Client",
      value:
        project.clientId && project.client ? (
          <Link
            href={`/clients/${project.clientId}`}
            className="font-medium text-ink hover:underline"
          >
            {project.client}
          </Link>
        ) : (
          <span className="font-medium text-ink">No client</span>
        ),
    },
    {
      label: "Deadline",
      value: (
        <span className="font-medium text-ink">
          {project.deadlineLabel &&
          project.deadlineLabel !== "No deadline set"
            ? project.deadlineLabel
            : "No deadline"}
        </span>
      ),
    },
    {
      label: "Project Value",
      value: (
        <span className="font-semibold text-ink">
          {formatMoney(project.value, project.currency)}
        </span>
      ),
    },
    {
      label: "Status",
      value: (
        <StatusBadge
          label={statusLabel(project.status)}
          tone={projectStatusTone(project.status)}
          icon={projectStatusIcon(project.status)}
        />
      ),
    },
    {
      label: "Created",
      value: (
        <span className="font-medium text-ink">{project.createdAt}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Progress + Payment — Dashboard Active Projects / Payments rhythm */}
      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] xl:grid-rows-[auto_1fr] xl:gap-x-6 xl:gap-y-4">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1 [&_.mb-3]:xl:mb-0">
          <OverviewSectionHead
            title="Project Progress"
            description="Track where the project stands."
          />
        </div>
        <div className="order-3 min-w-0 xl:order-none xl:col-start-2 xl:row-start-1 [&_.mb-3]:xl:mb-0">
          <OverviewSectionHead
            title="Payment"
            description="Keep track of this project's financial status."
            action={
              <button
                type="button"
                onClick={onGoInvoices}
                className="text-sm font-medium text-muted hover:text-ink"
              >
                View all
              </button>
            }
          />
        </div>

        <div className="min-w-0 space-y-3 xl:col-start-1 xl:row-start-2">
          <section className="card-surface p-5 sm:p-6">
            {total === 0 ? (
              <EmptyState
                icon={Check}
                title="No tasks yet"
                description="Add tasks to start tracking progress on this project."
                action={{ label: "Add Task", onClick: onGoTasks, icon: Plus }}
                compact
              />
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-ink">
                      {progress}%
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {done} of {total} tasks completed
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs font-medium text-muted">
                        Completed
                      </p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                        {done}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted">
                        Remaining
                      </p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                        {remainingTasks}
                      </p>
                    </div>
                  </div>
                </div>
                <ProgressBar className="mt-4" value={progress} />
              </>
            )}
          </section>

          <div>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="section-title">Next Up</h3>
              <button
                type="button"
                onClick={onGoTasks}
                className="text-sm font-medium text-muted hover:text-ink"
              >
                Open Tasks
              </button>
            </div>
            {nextTask ? (
              <TaskGridCard
                task={nextTask}
                onOpen={() => onOpenTask(nextTask.id)}
              />
            ) : (
              <div className="card-surface">
                <EmptyState
                  icon={Check}
                  title={
                    total > 0 ? "You're all caught up" : "Nothing queued yet"
                  }
                  description={
                    total > 0
                      ? "No outstanding tasks for this project."
                      : "Add a task so the next step is clear."
                  }
                  action={{
                    label: total > 0 ? "Open Tasks" : "Add Task",
                    onClick: onGoTasks,
                    icon: total > 0 ? undefined : Plus,
                  }}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <div className="order-4 flex min-h-0 min-w-0 flex-col xl:order-none xl:col-start-2 xl:row-start-2">
          <section className="card-surface flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">Outstanding</p>
                <p
                  className={`mt-1.5 text-xl font-semibold tracking-tight ${moneyToneClass(
                    project.remaining > 0 ? "outstanding" : "paid",
                  )}`}
                >
                  {formatMoney(project.remaining, project.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-soft">
                  Across {outstandingInvoices} invoice
                  {outstandingInvoices === 1 ? "" : "s"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">Collected</p>
                <p
                  className={`mt-1.5 text-xl font-semibold tracking-tight ${moneyToneClass(
                    "collected",
                  )}`}
                >
                  {formatMoney(project.paid, project.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-soft">
                  of {formatMoney(project.value, project.currency)} total
                </p>
              </div>
            </div>

            {recentInvoices.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No invoices yet"
                description="Create an invoice to track payments on this project."
                action={{
                  label: "View Invoices",
                  onClick: onGoInvoices,
                  icon: Plus,
                }}
                compact
              />
            ) : (
              <ul className="min-h-0 flex-1">
                {recentInvoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="border-b border-border last:border-0"
                  >
                    <button
                      type="button"
                      onClick={onGoInvoices}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-ink">
                            {inv.number} — {inv.title}
                          </p>
                          <StatusBadge
                            label={paymentStatusLabel(inv.status)}
                            tone={paymentStatusTone(inv.status)}
                            icon={paymentStatusIcon(inv.status)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {project.client || "Client"} ·{" "}
                          <span className={moneyToneClass(inv.status)}>
                            {formatMoney(inv.amount, project.currency)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-soft">
                          Due {inv.due}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Recent Activity + Client Portal + Project Information */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-6">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <OverviewSectionHead
            title="Recent Activity"
            description="See what's been happening on this project."
            action={
              activity.length > 0 ? (
                <Link
                  href={`/activity?project=${encodeURIComponent(project.slug)}`}
                  className="text-sm font-medium text-muted hover:text-ink"
                >
                  View all
                </Link>
              ) : undefined
            }
          />
          <div className="card-surface overflow-hidden">
            <ActivityList
              items={activity}
              limit={5}
              showGroups={false}
              compact
              bare
              emptyTitle="No activity yet"
              emptyDescription="Project activity will appear here as work gets moving."
            />
          </div>
        </div>

        <div className="min-w-0">
          <OverviewSectionHead
            title="Client Portal"
            description="Control what your client can see."
          />
          <section className="card-surface flex flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">Client Portal</p>
              <StatusBadge
                label="Active"
                tone={projectStatusTone("active")}
                icon={projectStatusIcon("active")}
              />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Visible to</dt>
                <dd className="truncate font-medium text-ink">
                  {project.client || "No client"}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted">Link</dt>
                <dd className="truncate font-mono text-xs text-ink">
                  {portalDisplayPath(project.portalUrl)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenPortal}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] btn-accent px-3.5 text-sm font-medium"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.75} />
                Open Portal
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] btn-secondary px-3.5 text-sm font-medium"
              >
                <Copy className="size-3.5" strokeWidth={1.75} />
                Copy Link
              </button>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted">Client can see</p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {clientCanSee.map((item) => (
                  <li
                    key={item}
                    className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="min-w-0">
          <OverviewSectionHead
            title="Project Information"
            description="The essentials for this project."
          />
          <section className="card-surface overflow-hidden">
            <dl>
              {infoFields.map((field, i) => (
                <div
                  key={field.label}
                  className={`flex items-center justify-between gap-3 px-5 py-3.5 text-sm ${
                    i < infoFields.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <dt className="shrink-0 text-muted">{field.label}</dt>
                  <dd className="min-w-0 truncate text-right">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function resolveTaskStatus(task: ProjectTask): ProjectTaskStatus {
  if (task.status) return task.status;
  return task.done ? "completed" : "todo";
}

function isDueSoon(due?: string) {
  if (!due) return false;
  const t = due.trim().toLowerCase();
  return t === "tomorrow" || t === "today" || t.includes("due soon");
}

function isOverdue(due?: string) {
  if (!due) return false;
  const t = due.trim().toLowerCase();
  return t.includes("overdue") || t.includes("late");
}

function taskDueLabel(due?: string, completed?: boolean) {
  if (completed) return "Completed";
  if (!due?.trim()) return "No deadline";
  return due.trim();
}

/** Pill chip for relative due states; muted text for calendar dates. */
function TaskDueBadge({
  due,
  completed,
  withPrefix = false,
}: {
  due?: string;
  completed?: boolean;
  withPrefix?: boolean;
}) {
  const label = taskDueLabel(due, completed);
  const display = label === "No deadline" ? "—" : label;
  const surface = deadlineToneSurface(label);

  const value = surface ? (
    <span className={surface}>
      <Clock className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="truncate">{display}</span>
    </span>
  ) : (
    <span className="truncate text-[11px] font-medium text-muted">{display}</span>
  );

  if (!withPrefix) return value;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 text-xs">
      <span className="shrink-0 font-medium text-muted-soft">Due:</span>
      {value}
    </span>
  );
}

function TaskVisibilityLabel({ visible }: { visible: boolean }) {
  return (
    <span className="text-xs text-muted">{visible ? "Visible" : "Private"}</span>
  );
}

function TaskRowMenu({
  open,
  onClose,
  onAction,
  position,
  status,
  visibleToClient,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  position?: { x: number; y: number } | null;
  status: ProjectTaskStatus;
  visibleToClient: boolean;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      position={position}
      clampHeight={360}
      items={[
        { id: "open", label: "Open Task", icon: FolderKanban },
        { id: "edit", label: "Edit Task", icon: Pencil },
        {
          id: "todo",
          label: "Mark To Do",
          icon: taskStatusIcon("todo"),
          hidden: status === "todo",
        },
        {
          id: "progress",
          label: "Mark In Progress",
          icon: taskStatusIcon("in-progress"),
          hidden: status === "in-progress",
        },
        {
          id: "complete",
          label: "Mark Completed",
          icon: Check,
          hidden: status === "completed",
        },
        {
          id: "visibility",
          label: visibleToClient ? "Hide from client" : "Show to client",
          icon: visibleToClient ? EyeOff : Eye,
          dividerBefore: true,
        },
        {
          id: "delete",
          label: "Delete Task",
          icon: Trash2,
          danger: true,
          dividerBefore: true,
        },
      ]}
    />
  );
}

/** Grid / Next Up card — shared so Overview matches Tasks grid. */
function TaskGridCard({
  task,
  onToggleDone,
  onOpen,
  onContextMenu,
  menu,
}: {
  task: ProjectTask;
  onToggleDone?: () => void;
  onOpen?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  menu?: ReactNode;
}) {
  const status = resolveTaskStatus(task);
  const completed = status === "completed";

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={(e) => {
        if (!onOpen) return;
        const t = e.target as HTMLElement;
        if (
          t.closest("button") ||
          t.closest("a") ||
          t.closest("[role='menu']")
        ) {
          return;
        }
        onOpen();
      }}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={onContextMenu}
      className={`card-surface-interactive flex flex-col p-3.5 ${
        onOpen ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {onToggleDone ? (
            <button
              type="button"
              data-hover-stop
              onClick={(e) => {
                e.stopPropagation();
                onToggleDone();
              }}
              aria-label={completed ? "Mark incomplete" : "Mark complete"}
              className="mt-0.5 shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <AppCheckbox checked={completed} />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p
                className={`truncate text-sm font-semibold ${
                  completed ? "text-muted" : "text-ink"
                }`}
              >
                {task.name}
              </p>
              <StatusBadge
                label={taskStatusLabel(status)}
                tone={taskStatusTone(status)}
                icon={taskStatusIcon(status)}
              />
            </div>
            {task.description ? (
              <p className="mt-1.5 line-clamp-2 text-xs text-muted">
                {task.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {menu ? (
            <div className="relative" data-hover-stop>
              {menu}
            </div>
          ) : null}
          <TaskDueBadge due={task.due} completed={completed} withPrefix />
          <TaskVisibilityLabel visible={task.visibleToClient} />
        </div>
      </div>
    </div>
  );
}

function TaskDetailPopup({
  task,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  task: ProjectTask | null;
  open: boolean;
  onClose: () => void;
  onSave: (next: ProjectTask) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectTaskStatus>("todo");
  const [due, setDue] = useState("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!task || !open) return;
    setName(task.name);
    setDescription(task.description ?? "");
    setStatus(resolveTaskStatus(task));
    setDue(task.due ?? "");
    setVisible(task.visibleToClient);
  }, [task, open]);

  if (!task) return null;

  const save = () => {
    const n = name.trim();
    if (!n) return;
    onSave({
      ...task,
      name: n,
      description: description.trim() || undefined,
      status,
      done: status === "completed",
      due: due.trim() || undefined,
      visibleToClient: visible,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Popup open={open} onClose={onClose} labelledBy="task-detail-title">
      <div className="relative w-[min(100vw-2rem,28rem)] bg-card p-6">
        <div className="absolute right-3 top-3">
          <PopupCloseButton onClick={onClose} />
        </div>
        <h2
          id="task-detail-title"
          className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
        >
          Task details
        </h2>
        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Title
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Task title"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-field min-h-[6rem] resize-y"
              placeholder="What needs to get done"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Status
              </span>
              <Dropdown
                aria-label="Task status"
                value={status}
                onChange={(v) => setStatus(v as ProjectTaskStatus)}
                options={[
                  { value: "todo", label: "To Do" },
                  { value: "in-progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Due date
              </span>
              <input
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="input-field"
                placeholder="Optional — e.g. Sep 30"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <ClientVisibleToggle visible={visible} onChange={setVisible} />
            <TaskDueBadge due={due || undefined} completed={status === "completed"} />
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            Delete Task
          </button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-accent px-4 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Popup>
  );
}

const TASK_FILTER_CHIPS = [
  { id: "all", label: "All" },
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "due-soon", label: "Due soon" },
  { id: "overdue", label: "Overdue" },
] as const;

const TASK_SORT_OPTIONS = [
  { id: "updated", label: "Recently Updated" },
  { id: "due", label: "Due Date" },
  { id: "created", label: "Created Date" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
] as const;

const taskChipClass = (active: boolean) =>
  `h-8 cursor-pointer rounded-[8px] px-3 text-xs font-medium transition-colors ${
    active
      ? "bg-accent text-ink"
      : "text-muted hover:bg-bg-hover hover:text-ink"
  }`;

function TasksTab({
  tasks,
  setTasks,
  onActivity,
  onOpenTask,
  detailTaskId,
  onCloseDetail,
}: {
  tasks: ProjectTask[];
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
  onOpenTask: (id: string) => void;
  detailTaskId: string | null;
  onCloseDetail: () => void;
}) {
  const toast = useToastOptional();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addStatus, setAddStatus] = useState<ProjectTaskStatus>("todo");
  const [addDue, setAddDue] = useState("");
  const [visible, setVisible] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { done, total, progress } = progressFromTasks(tasks);
  const remaining = Math.max(0, total - done);

  const syncFail = (msg: string) => toast?.error(msg);

  const closeMenu = () => {
    setMenuId(null);
    setMenuPos(null);
  };

  const openMenuAt = (
    id: string,
    pos: { x: number; y: number } | null,
  ) => {
    if (menuId === id && !pos && !menuPos) {
      closeMenu();
      return;
    }
    setMenuId(id);
    setMenuPos(pos);
  };

  const visibleTasks = useMemo(() => {
    let list = [...tasks];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter === "todo") {
      list = list.filter((t) => resolveTaskStatus(t) === "todo");
    } else if (filter === "in-progress") {
      list = list.filter((t) => resolveTaskStatus(t) === "in-progress");
    } else if (filter === "completed") {
      list = list.filter((t) => resolveTaskStatus(t) === "completed");
    } else if (filter === "due-soon") {
      list = list.filter(
        (t) =>
          resolveTaskStatus(t) !== "completed" && isDueSoon(t.due),
      );
    } else if (filter === "overdue") {
      list = list.filter(
        (t) =>
          resolveTaskStatus(t) !== "completed" && isOverdue(t.due),
      );
    }

    list.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "due") {
        return (a.due || "zzz").localeCompare(b.due || "zzz");
      }
      if (sort === "created") {
        return a.id.localeCompare(b.id);
      }
      // recently updated
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
    return list;
  }, [tasks, query, filter, sort]);

  const toggleDone = (id: string) => {
    const prev = tasks;
    const task = tasks.find((t) => t.id === id);
    const nextDone = task ? !task.done : false;
    setTasks((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              status: !t.done ? "completed" : "todo",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    if (task && nextDone) {
      onActivity?.(`You completed ${task.name}`, "task");
    }
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't update the task. Try again.");
      }
    });
  };

  const setTaskStatus = (id: string, status: ProjectTaskStatus) => {
    const prev = tasks;
    setTasks((list) =>
      list.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              done: status === "completed",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    closeMenu();
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't update the task. Try again.");
      }
    });
  };

  const setTaskVisibility = (id: string, visibleToClient: boolean) => {
    const prev = tasks;
    setTasks((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, visibleToClient, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
    closeMenu();
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't update visibility. Try again.");
      }
    });
  };

  const onMenuAction = (task: ProjectTask, action: string) => {
    if (action === "open" || action === "edit") onOpenTask(task.id);
    if (action === "todo") setTaskStatus(task.id, "todo");
    if (action === "progress") setTaskStatus(task.id, "in-progress");
    if (action === "complete") setTaskStatus(task.id, "completed");
    if (action === "visibility")
      setTaskVisibility(task.id, !task.visibleToClient);
    if (action === "delete") setDeleteId(task.id);
    closeMenu();
  };

  const addTask = () => {
    const n = name.trim();
    if (!n) return;
    const prev = tasks;
    const task: ProjectTask = {
      id: `task_${Date.now()}`,
      name: n,
      description: description.trim() || undefined,
      done: addStatus === "completed",
      status: addStatus,
      due: addDue.trim() || undefined,
      visibleToClient: visible,
      updatedAt: new Date().toISOString(),
    };
    setTasks((list) => [...list, task]);
    setName("");
    setDescription("");
    setAddStatus("todo");
    setAddDue("");
    setVisible(true);
    setAdding(false);
    onActivity?.(`You added ${n}`, "task");
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't add the task. Try again.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const prev = tasks;
    const id = deleteId;
    setTasks((list) => list.filter((t) => t.id !== id));
    setDeleteId(null);
    closeMenu();
    if (detailTaskId === id) onCloseDetail();
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't delete the task. Try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Tasks</h2>
          <p className="mt-1 text-sm text-muted">
            Keep the work moving and see what&apos;s left to complete.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {total > 0 ? (
            <div
              role="group"
              aria-label="Task layout"
              className="inline-flex h-11 items-center gap-0.5 rounded-[8px] border border-border bg-card p-1"
            >
              <button
                type="button"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  viewMode === "list"
                    ? "bg-surface text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                <LayoutList className="size-3.5" strokeWidth={1.75} />
                List
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  viewMode === "grid"
                    ? "bg-surface text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                <LayoutGrid className="size-3.5" strokeWidth={1.75} />
                Grid
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            Add Task
          </button>
        </div>
      </div>

      {/* Progress — same card language as Overview Project Progress */}
      {total > 0 ? (
        <section className="card-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-ink">
                {progress}%
              </p>
              <p className="mt-1 text-sm text-muted">
                {done} of {total} tasks completed
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-medium text-muted">Completed</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                  {done}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Remaining</p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                  {remaining}
                </p>
              </div>
            </div>
          </div>
          <ProgressBar className="mt-4" value={progress} />
        </section>
      ) : null}

      {/* Controls — same search / chips / sort language as Projects */}
      {total > 0 || query || filter !== "all" ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 transition-colors focus-within:border-border-strong lg:max-w-md">
            <Search
              className="size-4 shrink-0 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
              >
                <X className="size-3.5" strokeWidth={2} />
              </button>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Task status"
              className="flex flex-wrap gap-1.5"
            >
              {TASK_FILTER_CHIPS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={taskChipClass(filter === f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <MenuDropdown
              value={sort}
              onChange={setSort}
              options={TASK_SORT_OPTIONS}
              labelPrefix="Sort: "
              aria-label="Sort tasks"
              widthLabel="Sort: Recently Updated"
            />
          </div>
        </div>
      ) : null}

      {/* Inline add */}
      {adding ? (
        <div className="card-surface space-y-3 p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Title
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="Task title"
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what needs to get done"
              rows={3}
              className="input-field min-h-[5.5rem] resize-y"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Status
              </span>
              <Dropdown
                aria-label="New task status"
                value={addStatus}
                onChange={(v) => setAddStatus(v as ProjectTaskStatus)}
                options={[
                  { value: "todo", label: "To Do" },
                  { value: "in-progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                ]}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Due date
              </span>
              <input
                value={addDue}
                onChange={(e) => setAddDue(e.target.value)}
                placeholder="Optional — e.g. Sep 30"
                className="input-field"
              />
            </label>
          </div>
          <div className="flex items-center justify-end">
            <ClientVisibleToggle visible={visible} onChange={setVisible} />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addTask}
              className="h-9 rounded-[8px] btn-accent px-4 text-sm font-semibold"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setName("");
                setDescription("");
                setAddStatus("todo");
                setAddDue("");
                setVisible(true);
              }}
              className="h-9 rounded-[8px] border border-border px-4 text-sm font-medium text-muted hover-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* List / Grid */}
      {tasks.length === 0 && !adding ? (
        <div className="card-surface">
          <EmptyState
            icon={Check}
            title="No tasks yet"
            description="Add tasks to start tracking the work for this project."
            action={{
              label: "Add Task",
              icon: Plus,
              onClick: () => setAdding(true),
            }}
            compact
          />
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="card-surface px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">No matching tasks</p>
          <p className="mt-1 text-sm text-muted">
            Try a different search or filter.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <TaskGridCard
                task={task}
                onToggleDone={() => toggleDone(task.id)}
                onOpen={() => onOpenTask(task.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openMenuAt(task.id, { x: e.clientX, y: e.clientY });
                }}
                menu={
                  <button
                    type="button"
                    data-hover-stop
                    aria-label="Task actions"
                    aria-expanded={menuId === task.id && !menuPos}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (menuId === task.id && !menuPos) {
                        closeMenu();
                      } else {
                        const rect = (
                          e.currentTarget as HTMLButtonElement
                        ).getBoundingClientRect();
                        openMenuAt(task.id, {
                          x: Math.min(
                            rect.right - 208,
                            window.innerWidth - 220,
                          ),
                          y: rect.bottom + 6,
                        });
                      }
                    }}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                  >
                    <MoreHorizontal className="size-4" strokeWidth={1.75} />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="hidden border-b border-border px-5 py-2.5 text-[11px] font-medium text-muted-soft sm:grid sm:grid-cols-[minmax(0,1.6fr)_7.5rem_8rem_5.5rem_2.5rem] sm:gap-3">
            <span>Task</span>
            <span>Status</span>
            <span>Due</span>
            <span>Visibility</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul>
            {visibleTasks.map((task) => {
              const status = resolveTaskStatus(task);
              const completed = status === "completed";
              return (
                <li
                  key={task.id}
                  className={`group relative border-b border-border last:border-0 ${
                    completed ? "bg-card" : ""
                  }`}
                >
                  <div
                    role="button"
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
                      onOpenTask(task.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenTask(task.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openMenuAt(task.id, { x: e.clientX, y: e.clientY });
                    }}
                    className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent sm:grid sm:grid-cols-[minmax(0,1.6fr)_7.5rem_8rem_5.5rem_2.5rem] sm:items-center sm:gap-3 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                      <button
                        type="button"
                        data-hover-stop
                        onClick={() => toggleDone(task.id)}
                        aria-label={
                          completed ? "Mark incomplete" : "Mark complete"
                        }
                        className="mt-0.5 shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/20 sm:mt-0"
                      >
                        <AppCheckbox checked={completed} />
                      </button>
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${
                            completed ? "text-muted" : "text-ink"
                          }`}
                        >
                          {task.name}
                        </p>
                        {task.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="pl-8 sm:pl-0">
                      <StatusBadge
                        label={taskStatusLabel(status)}
                        tone={taskStatusTone(status)}
                        icon={taskStatusIcon(status)}
                      />
                    </div>

                    <div className="pl-8 sm:pl-0">
                      <TaskDueBadge
                        due={task.due}
                        completed={completed}
                      />
                    </div>

                    <div className="pl-8 sm:pl-0">
                      <TaskVisibilityLabel visible={task.visibleToClient} />
                    </div>

                    <div className="absolute right-3 top-3 sm:relative sm:right-auto sm:top-auto">
                      <button
                        type="button"
                        data-hover-stop
                        aria-label="Task actions"
                        aria-expanded={menuId === task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (menuId === task.id) {
                            closeMenu();
                            return;
                          }
                          const rect = (
                            e.currentTarget as HTMLButtonElement
                          ).getBoundingClientRect();
                          openMenuAt(task.id, {
                            x: Math.min(
                              rect.right - 208,
                              window.innerWidth - 220,
                            ),
                            y: rect.bottom + 6,
                          });
                        }}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
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

      {menuId && menuPos ? (
        <TaskRowMenu
          open
          position={menuPos}
          status={resolveTaskStatus(
            tasks.find((t) => t.id === menuId) ?? {
              id: menuId,
              name: "",
              done: false,
              visibleToClient: false,
            },
          )}
          visibleToClient={
            tasks.find((t) => t.id === menuId)?.visibleToClient ?? false
          }
          onClose={closeMenu}
          onAction={(a) => {
            const task = tasks.find((t) => t.id === menuId);
            if (task) onMenuAction(task, a);
            else closeMenu();
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this task?"
        description="This will remove the task from the project."
        confirmLabel="Delete Task"
      />
    </div>
  );
}

type FileRow = ProjectFile & {
  uploadStatus?: "uploading" | "failed" | "ready";
  uploadProgress?: number;
};

function FilesTab({
  projectSlug,
  onActivity,
}: {
  projectSlug: string;
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const toast = useToastOptional();
  const [files, setFiles] = useState<FileRow[]>(() =>
    (seedProjectFiles[projectSlug] ?? []).map((f) => ({
      ...f,
      uploadStatus: "ready" as const,
    })),
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleVisible = (id: string, next: boolean) => {
    const prev = files;
    setFiles((list) =>
      list.map((f) => (f.id === id ? { ...f, visibleToClient: next } : f)),
    );
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setFiles(prev);
        toast?.error("Couldn't update this setting.");
      }
    });
  };

  const startUpload = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const file = fileList[0];
    const id = `up_${Date.now()}`;
    const row: FileRow = {
      id,
      name: file.name,
      type: file.name.toLowerCase().endsWith(".zip")
        ? "ZIP"
        : file.type.startsWith("image/")
          ? "IMG"
          : "PDF",
      size: `${Math.max(0.1, file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploaded: "Just now",
      visibleToClient: true,
      uploadStatus: "uploading",
      uploadProgress: 0,
    };
    setFiles((list) => [row, ...list]);

    let progress = 0;
    const tick = window.setInterval(() => {
      progress = Math.min(progress + 20, 100);
      setFiles((list) =>
        list.map((f) =>
          f.id === id ? { ...f, uploadProgress: progress } : f,
        ),
      );
      if (progress >= 100) {
        window.clearInterval(tick);
        void backgroundSync({ delay: 150 }).then((r) => {
          if (!r.ok) {
            setFiles((list) =>
              list.map((f) =>
                f.id === id
                  ? { ...f, uploadStatus: "failed", uploadProgress: undefined }
                  : f,
              ),
            );
          } else {
            setFiles((list) =>
              list.map((f) =>
                f.id === id
                  ? {
                      ...f,
                      uploadStatus: "ready",
                      uploadProgress: undefined,
                    }
                  : f,
              ),
            );
            toast?.success("File uploaded");
            onActivity?.(`You uploaded ${file.name}`, "file");
          }
        });
      }
    }, 160);
  };

  const retryUpload = (id: string) => {
    setFiles((list) =>
      list.map((f) =>
        f.id === id
          ? { ...f, uploadStatus: "uploading", uploadProgress: 0 }
          : f,
      ),
    );
    let progress = 0;
    const tick = window.setInterval(() => {
      progress = Math.min(progress + 28, 100);
      setFiles((list) =>
        list.map((f) =>
          f.id === id ? { ...f, uploadProgress: progress } : f,
        ),
      );
      if (progress >= 100) {
        window.clearInterval(tick);
        setFiles((list) =>
          list.map((f) =>
            f.id === id
              ? { ...f, uploadStatus: "ready", uploadProgress: undefined }
              : f,
          ),
        );
      }
    }, 120);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const prev = files;
    setFiles((list) => list.filter((f) => f.id !== deleteId));
    toast?.undo("File deleted", () => setFiles(prev));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setFiles(prev);
        toast?.error("Couldn't delete the file. Try again.");
      }
    });
  };

  return (
    <div
      className={`space-y-5 ${dragging ? "rounded-[12px] ring-2 ring-ink/20" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        startUpload(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="section-title">Files</h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold"
        >
          <Upload className="size-4" strokeWidth={1.75} />
          Upload Files
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            startUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            icon={Upload}
            title="No files yet"
            description="Upload files to keep everything for this project in one place."
            action={{
              label: "Upload Files",
              icon: Upload,
              onClick: () => inputRef.current?.click(),
            }}
            compact
          />
        </div>
      ) : (
        <ul className="card-surface overflow-hidden">
          {files.map((file, index) => {
            const Icon = fileIcon(file.type);
            return (
              <li
                key={file.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 sm:px-4 ${
                  index < files.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {file.name}
                  </p>
                  {file.uploadStatus === "uploading" ? (
                    <p className="text-xs text-muted">
                      Uploading {file.uploadProgress ?? 0}%
                    </p>
                  ) : file.uploadStatus === "failed" ? (
                    <p className="text-xs text-danger">Upload failed</p>
                  ) : (
                    <p className="truncate text-xs text-muted-soft">
                      {file.type} · {file.size} · {file.uploaded}
                    </p>
                  )}
                  {file.uploadStatus === "uploading" ? (
                    <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${file.uploadProgress ?? 0}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {file.uploadStatus === "failed" ? (
                    <button
                      type="button"
                      onClick={() => retryUpload(file.id)}
                      className="h-8 rounded-[8px] bg-surface px-2.5 text-xs font-semibold text-ink hover-soft"
                    >
                      Retry
                    </button>
                  ) : null}
                  {file.uploadStatus === "ready" ? (
                    <>
                      <ClientVisibleToggle
                        visible={file.visibleToClient}
                        onChange={(next) => toggleVisible(file.id, next)}
                      />
                      <button
                        type="button"
                        aria-label="Download"
                        className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete file"
                        onClick={() => setDeleteId(file.id)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft hover:text-danger"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this file?"
        description="This file will be permanently removed."
        confirmLabel="Delete File"
      />
    </div>
  );
}

function InvoicesTab({
  invoices,
  setInvoices,
  currency,
  onActivity,
}: {
  invoices: ProjectInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<ProjectInvoice[]>>;
  currency: string;
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const toast = useToastOptional();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [status, setStatus] = useState<ProjectInvoice["status"]>("due");

  const markPaid = (id: string) => {
    const prev = invoices;
    const inv = invoices.find((i) => i.id === id);
    setInvoices((list) =>
      list.map((row) =>
        row.id === id
          ? {
              ...row,
              status: "paid" as const,
              paid: row.amount,
              remaining: 0,
            }
          : row,
      ),
    );
    if (inv) onActivity?.(`Invoice ${inv.number} was paid`, "payment");
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setInvoices(prev);
        toast?.error("Couldn't update invoice.");
      }
    });
  };

  const openCreate = () => {
    setNumber(`INV-${String(invoices.length + 1).padStart(3, "0")}`);
    setTitle("");
    setAmount("");
    setDue("");
    setPaymentLink("");
    setStatus("due");
    setCreating(true);
  };

  const createInvoice = () => {
    const n = number.trim() || `INV-${String(invoices.length + 1).padStart(3, "0")}`;
    const amt = Number(String(amount).replace(/[$,\s]/g, ""));
    if (!Number.isFinite(amt) || amt < 0) {
      toast?.error("Enter a valid amount.");
      return;
    }
    const prev = invoices;
    const inv: ProjectInvoice = {
      id: `inv_${Date.now()}`,
      number: n,
      title: title.trim() || "Invoice",
      amount: amt,
      due: due.trim() || "—",
      paid: status === "paid" ? amt : 0,
      remaining: status === "paid" ? 0 : amt,
      status,
      hasPaymentLink: Boolean(paymentLink.trim()),
    };
    setInvoices((list) => [inv, ...list]);
    setCreating(false);
    notifyProjectsChanged();
    onActivity?.(`You created ${n}`, "payment");
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setInvoices(prev);
        toast?.error("Couldn't create invoice.");
      } else {
        toast?.success("Invoice created");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const prev = invoices;
    setInvoices((list) => list.filter((i) => i.id !== deleteId));
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setInvoices(prev);
        toast?.error("Couldn't delete invoice. Try again.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="section-title">Invoices</h3>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Create Invoice
        </button>
      </div>

      {creating ? (
        <div className="card-surface space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Invoice number
              </span>
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Amount ({currency})
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
                inputMode="decimal"
                placeholder="0"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Description
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="What this invoice covers"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Due date
              </span>
              <input
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="input-field"
                placeholder="Oct 30"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Status
              </span>
              <Dropdown
                aria-label="Invoice status"
                value={status}
                onChange={(v) => setStatus(v as ProjectInvoice["status"])}
                options={[
                  { value: "due", label: "Due" },
                  { value: "paid", label: "Paid" },
                  { value: "partial", label: "Partial" },
                  { value: "overdue", label: "Overdue" },
                  { value: "processing", label: "Processing" },
                  { value: "failed", label: "Failed" },
                ]}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              External payment link
            </span>
            <input
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              className="input-field"
              placeholder="https://"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createInvoice}
              className="h-9 rounded-[8px] btn-secondary px-4 text-sm font-medium"
            >
              Create Invoice
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="h-9 rounded-[8px] border border-border px-4 text-sm font-medium text-muted hover-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {invoices.length === 0 && !creating ? (
        <div className="card-surface">
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create an invoice to start tracking project payments."
            action={{
              label: "Create Invoice",
              icon: Plus,
              onClick: openCreate,
            }}
            compact
          />
        </div>
      ) : invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <article key={inv.id} className="card-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-ink">{inv.number}</p>
                  <p className="mt-0.5 text-sm text-muted">{inv.title}</p>
                </div>
                <div className="sm:text-right">
                  <p
                    className={`text-lg font-semibold ${moneyToneClass(
                      inv.status === "paid" ? "paid" : inv.status,
                    )}`}
                  >
                    {formatMoney(inv.amount, currency)}
                  </p>
                  <p className="text-xs text-muted-soft">Due {inv.due}</p>
                  <div className="mt-1.5 flex sm:justify-end">
                    <StatusBadge
                      label={paymentStatusLabel(inv.status)}
                      tone={paymentStatusTone(inv.status)}
                      icon={paymentStatusIcon(inv.status)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {inv.status !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => markPaid(inv.id)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-[8px] btn-accent px-3.5 text-sm font-semibold"
                  >
                    Mark Paid
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDeleteId(inv.id)}
                  className="inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-muted hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this invoice?"
        description="This invoice will be permanently removed."
        confirmLabel="Delete Invoice"
      />
    </div>
  );
}

type LocalMessage = ProjectMessage & {
  status?: "pending" | "sent" | "failed";
};

function MessagesTab({
  projectSlug,
  onActivity,
}: {
  projectSlug: string;
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>(() =>
    structuredClone(seedProjectMessages[projectSlug] ?? []),
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    const id = `msg_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id,
        author: "freelancer",
        name: "Alex",
        body,
        time: "Just now",
        status: "pending",
      },
    ]);
    setDraft("");
    onActivity?.("You sent a message", "message");
    void backgroundSync({ delay: 450 }).then((r) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: r.ok ? "sent" : "failed" } : m,
        ),
      );
    });
  };

  const retry = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "pending" } : m)),
    );
    void backgroundSync({ delay: 350 }).then((r) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: r.ok ? "sent" : "failed" } : m,
        ),
      );
    });
  };

  return (
    <div className="card-surface flex min-h-[420px] flex-col overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="section-title">Messages</h3>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={Send}
            title="No messages yet"
            description="Messages from you and your client will appear here."
            compact
          />
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((msg) => {
            const isMe = msg.author === "freelancer";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <p className="mb-1 text-xs font-medium text-muted">
                  {msg.name}
                  <span className="ml-2 font-normal text-muted-soft">
                    {msg.time}
                  </span>
                </p>
                <div
                  className={`max-w-[85%] rounded-[10px] px-3.5 py-2 text-sm leading-relaxed ${
                    isMe ? "bg-accent text-ink" : "bg-surface text-ink"
                  } ${msg.status === "pending" ? "opacity-70" : ""}`}
                >
                  {msg.body}
                </div>
                {msg.status === "failed" ? (
                  <button
                    type="button"
                    onClick={() => retry(msg.id)}
                    className="mt-1 cursor-pointer text-xs font-semibold text-danger"
                  >
                    Failed to send · Retry
                  </button>
                ) : null}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a message..."
          rows={1}
          aria-label="Write a message"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-[8px] border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold disabled:opacity-50"
        >
          <Send className="size-4" strokeWidth={1.75} />
          Send
        </button>
      </div>
    </div>
  );
}

function mapCreated(
  created: NonNullable<ReturnType<typeof getCreatedProjectBySlug>>,
): { project: ProjectDetail; tasks: ProjectTask[] } {
  const done = created.tasks.filter((t) => t.done).length;
  const total = created.tasks.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const next = created.tasks.find((t) => !t.done);
  const finance = seedProjectFinance[created.slug];
  const paid = finance?.paid ?? 0;
  const value = created.value ?? 0;
  const remaining = Math.max(0, value - paid);
  const paymentState =
    finance?.paymentStatus === "paid"
      ? ("paid" as const)
      : finance?.paymentStatus === "overdue"
        ? ("overdue" as const)
        : finance?.paymentStatus === "processing"
          ? ("processing" as const)
          : finance?.paymentStatus === "failed"
            ? ("failed" as const)
            : remaining > 0
              ? ("due" as const)
              : ("paid" as const);
  const deadlineRelative = created.deadline
    ? deadlineLabelFromIso(created.deadline)
    : "No deadline";
  const overdue = deadlineRelative.toLowerCase().includes("overdue");
  const status: ProjectStatus =
    created.status === "draft" ||
    created.status === "on-hold" ||
    created.status === "completed" ||
    created.status === "archived"
      ? created.status
      : "active";

  return {
    project: {
      id: created.id,
      slug: created.slug,
      name: created.name,
      client: created.clientName || "No client",
      clientId: created.clientId || "",
      clientEmail: created.clientEmail,
      description: created.description,
      status,
      value,
      currency: created.currency,
      paid,
      remaining,
      paymentState,
      progress,
      tasksCompleted: done,
      tasksTotal: total,
      deadline: created.deadline
        ? new Date(created.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No deadline set",
      deadlineLabel: created.deadline
        ? new Date(created.deadline).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })
        : "No deadline set",
      deadlineRelative,
      daysRemaining: 0,
      overdue,
      nextUp: next
        ? { title: next.name, description: next.description || "" }
        : null,
      portalUrl: created.portalPath,
      lastPortalView: "12 min ago",
      createdAt: new Date(created.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      updatedAt: created.updatedAt || created.createdAt,
    },
    tasks: created.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      done: t.done,
      visibleToClient: t.visibleToClient,
      status: t.status,
      due: t.due,
      updatedAt: t.updatedAt,
    })),
  };
}

type ProjectDetailPageProps = {
  slug?: string;
  initialTab?: string;
};

export default function ProjectDetailPage({
  slug,
  initialTab,
}: ProjectDetailPageProps) {
  const router = useRouter();
  const toast = useToastOptional();
  const { openEdit } = useProjectModal();
  const loading = useInitialLoading(400);
  const [ready, setReady] = useState(false);
  const [found, setFound] = useState(true);
  const [project, setProject] = useState<ProjectDetail>(emptyProjectDetail);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [isCreated, setIsCreated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [detailDeleteId, setDetailDeleteId] = useState<string | null>(null);

  const tab: TabId =
    initialTab && VALID_TABS.has(initialTab)
      ? (initialTab as TabId)
      : "overview";

  const setTab = (id: TabId) => {
    const base = `/projects/${slug || project.slug}`;
    if (id === "overview") router.replace(base, { scroll: false });
    else router.replace(`${base}?tab=${id}`, { scroll: false });
  };

  const pushActivity = (
    text: string,
    category: ProjectActivity["category"],
  ) => {
    const categoryMap: Record<
      ProjectActivity["category"],
      import("@/data/activityMock").ActivityCategory
    > = {
      portal: "portal",
      file: "files",
      message: "messages",
      payment: "invoices",
      task: "tasks",
      project: "projects",
    };
    appendActivity({
      description: text,
      context: project.name || "Project",
      category: categoryMap[category],
      href: `/projects/${project.slug || slug}`,
      actorKind: "you",
      projectSlug: project.slug || slug,
      projectName: project.name,
      projectId: project.id,
      clientName: project.client || undefined,
    });
  };

  useEffect(() => {
    if (!slug) {
      setFound(true);
      setReady(true);
      return;
    }
    const created = getCreatedProjectBySlug(slug);
    if (created) {
      const mapped = mapCreated(created);
      setProject(mapped.project);
      setTasks(mapped.tasks);
      setInvoices(
        structuredClone(seedProjectInvoices[created.slug] ?? []),
      );
      setIsCreated(true);
      setFound(true);
    } else {
      setFound(false);
    }
    setReady(true);
  }, [slug]);

  const live = useMemo(() => {
    const { done, total, progress } = progressFromTasks(tasks);
    const paid = invoices.reduce((s, i) => s + i.paid, 0);
    const value = project.value;
    const remaining = Math.max(0, value - paid);
    return {
      ...project,
      progress,
      tasksCompleted: done,
      tasksTotal: total,
      paid,
      remaining,
      paymentState: derivePaymentState(invoices, remaining),
    };
  }, [project, tasks, invoices]);

  const portalAbsolute = live.portalUrl.startsWith("http")
    ? live.portalUrl
    : `${typeof window !== "undefined" ? window.location.origin : ""}${live.portalUrl}`;

  const copyPortalLink = async () => {
    try {
      await navigator.clipboard.writeText(portalAbsolute);
      toast?.success("Portal link copied");
    } catch {
      toast?.toast({
        title: "Couldn't copy portal link",
        tone: "error",
        actionLabel: "Retry",
        onAction: () => void copyPortalLink(),
      });
    }
  };

  const onMenuAction = (action: string) => {
    if (action === "copy") {
      void copyPortalLink();
      return;
    }
    if (action === "complete") {
      const prev = live.status;
      setProject((p) => ({ ...p, status: "completed" }));
      pushActivity("You marked the project as completed", "project");
      notifyProjectsChanged();
      toast?.undo("Project marked completed", () =>
        setProject((p) => ({ ...p, status: prev })),
      );
      void backgroundSync().then((r) => {
        if (!r.ok) {
          setProject((p) => ({ ...p, status: prev }));
          toast?.error("Couldn't update the project. Try again.");
        }
      });
      return;
    }
    if (action === "archive") {
      const prev = live.status;
      setProject((p) => ({ ...p, status: "archived" }));
      pushActivity("You archived the project", "project");
      notifyProjectsChanged();
      toast?.undo("Project archived", () =>
        setProject((p) => ({ ...p, status: prev })),
      );
      void backgroundSync().then((r) => {
        if (!r.ok) {
          setProject((p) => ({ ...p, status: prev }));
          toast?.error("Couldn't update the project. Try again.");
        }
      });
      return;
    }
    if (action === "delete") {
      setDeleteOpen(true);
      return;
    }
    if (action === "duplicate") {
      const built = buildCreatedProject({
        name: `${live.name} (Copy)`,
        clientId: live.clientId || null,
        clientName: live.client || "Client",
        clientEmail: live.clientEmail || "",
        description: live.description,
        value: live.value ? String(live.value) : "",
        currency: live.currency,
        deadline: "",
        status: "draft",
        tasks: tasks.map((t) => ({
          name: t.name,
          description: t.description,
          done: false,
          visibleToClient: t.visibleToClient,
        })),
      });
      if (!built.ok) {
        toast?.error("Couldn't duplicate the project.");
        return;
      }
      commitCreatedProject(built.project);
      notifyProjectsChanged();
      toast?.success("Project duplicated");
      router.push(`/projects/${built.project.slug}`);
      return;
    }
    if (action === "edit") {
      openEditProject();
    }
  };

  const confirmDeleteProject = () => {
    const snapshot = isCreated ? getCreatedProjectBySlug(live.slug) : null;
    if (isCreated && snapshot) removeCreatedProject(snapshot.id);
    notifyProjectsChanged();
    router.push("/projects");
    void backgroundSync().then((r) => {
      if (!r.ok && snapshot) {
        restoreCreatedProject(snapshot);
        toast?.error("Couldn't delete the project. Try again.");
        router.push(`/projects/${snapshot.slug}`);
      }
    });
  };

  const saveProjectEdit = (values: ProjectFormEditValues) => {
    const prev = project;
    const prevTasks = tasks;
    setProject((p) => ({
      ...p,
      name: values.name,
      client: values.clientName,
      clientId: values.clientId || p.clientId,
      clientEmail: values.clientEmail,
      description: values.description,
      value: values.value ?? 0,
      currency: values.currency,
      deadline: values.deadline
        ? new Date(values.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "No deadline set",
      deadlineLabel: values.deadline
        ? new Date(values.deadline).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })
        : "No deadline set",
      deadlineRelative: values.deadline
        ? deadlineLabelFromIso(values.deadline)
        : "No deadline",
      status: values.status,
      updatedAt: "Just now",
    }));
    setTasks(
      values.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        done: t.done,
        visibleToClient: t.visibleToClient,
      })),
    );
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProject(prev);
        setTasks(prevTasks);
        toast?.error("Couldn't update the project. Try again.");
      }
    });
  };

  const openEditProject = () => {
    openEdit({
      initial: {
        id: live.id,
        name: live.name,
        clientId: live.clientId || null,
        clientName: live.client,
        clientEmail: live.clientEmail || "",
        description: live.description,
        value: live.value,
        currency: live.currency,
        deadline: live.deadline,
        status: live.status,
        tasks: tasks.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          done: t.done,
          visibleToClient: t.visibleToClient,
        })),
      },
      onSuccess: saveProjectEdit,
    });
  };

  if (!ready || loading) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar />
        <ProjectDetailSkeleton />
      </div>
    );
  }

  if (!found) {
    return (
      <div className="flex min-h-full flex-col">
        <DashboardTopBar
          breadcrumb={[
            { label: "Projects", href: "/projects" },
            { label: "Not found" },
          ]}
        />
        <ProjectNotFound />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar
        breadcrumb={[
          { label: "Projects", href: "/projects" },
          { label: live.name },
        ]}
      />

      <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Header — same rhythm as Dashboard */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="page-title">{live.name}</h1>
              <StatusBadge
                label={statusLabel(live.status)}
                tone={projectStatusTone(live.status)}
                icon={projectStatusIcon(live.status)}
              />
            </div>
            {live.clientId && live.client ? (
              <Link
                href={`/clients/${live.clientId}`}
                className="mt-1.5 inline-block text-sm text-muted hover:text-ink"
              >
                {live.client}
              </Link>
            ) : (
              <p className="mt-1.5 text-sm text-muted">No client assigned</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <a
              href={portalAbsolute}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold"
            >
              <ExternalLink className="size-4" strokeWidth={2} />
              Open Portal
            </a>
            <button
              type="button"
              onClick={() => void copyPortalLink()}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              <Link2 className="size-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Copy Portal Link</span>
              <span className="sm:hidden">Copy Link</span>
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Project actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex size-11 cursor-pointer items-center justify-center rounded-[8px] text-muted ${
                  menuOpen ? "bg-surface text-ink" : "hover-bg"
                }`}
              >
                <MoreHorizontal className="size-5" strokeWidth={1.75} />
              </button>
              <ProjectMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                onAction={onMenuAction}
                showComplete={
                  live.status !== "completed" && live.status !== "archived"
                }
              />
            </div>
          </div>
        </div>

        {/* Metrics — same card language as Dashboard summary */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="card-surface px-5 py-4">
            <p className="text-xs font-medium text-muted">Deadline</p>
            <p
              className={`mt-2 text-xl font-semibold tracking-tight sm:text-2xl ${deadlineToneClass(
                live.deadlineRelative,
              )}`}
            >
              {dueLabel(live.deadlineRelative)}
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              {live.deadlineLabel && live.deadlineLabel !== "No deadline set"
                ? live.deadlineLabel
                : "No date set"}
            </p>
          </div>
          <div className="card-surface px-5 py-4">
            <p className="text-xs font-medium text-muted">Project Value</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {formatMoney(live.value, live.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-soft">Total project</p>
          </div>
          <div className="card-surface px-5 py-4">
            <p className="text-xs font-medium text-muted">Payment</p>
            <p
              className={`mt-2 text-xl font-semibold tracking-tight sm:text-2xl ${moneyToneClass(
                live.paymentState === "paid" || live.remaining <= 0
                  ? "paid"
                  : live.paymentState === "overdue" ||
                      live.paymentState === "failed"
                    ? live.paymentState
                    : "due",
              )}`}
            >
              {paymentMetricLabel(
                live.remaining,
                live.paymentState,
                live.currency,
              )}
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              {formatMoney(live.paid, live.currency)} collected
            </p>
          </div>
          <div className="card-surface px-5 py-4">
            <p className="text-xs font-medium text-muted">Progress</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {live.progress}%
            </p>
            <ProgressBar className="mt-2" value={live.progress} />
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Project sections"
          className="mb-8 flex gap-1 overflow-x-auto border-b border-border"
        >
          {TABS.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 cursor-pointer px-4 py-3 text-sm font-medium transition-colors ${
                  selected ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {selected ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === "overview" && (
            <OverviewTab
              project={live}
              tasks={tasks}
              invoices={invoices}
              onGoTasks={() => setTab("tasks")}
              onOpenTask={(id) => setDetailTaskId(id)}
              onGoInvoices={() => setTab("invoices")}
              onCopyLink={() => void copyPortalLink()}
              onOpenPortal={() => {
                window.open(portalAbsolute, "_blank", "noopener,noreferrer");
              }}
            />
          )}
          {tab === "tasks" && (
            <TasksTab
              tasks={tasks}
              setTasks={setTasks}
              onActivity={pushActivity}
              detailTaskId={detailTaskId}
              onOpenTask={(id) => setDetailTaskId(id)}
              onCloseDetail={() => setDetailTaskId(null)}
            />
          )}
          {tab === "files" && (
            <FilesTab
              projectSlug={live.slug}
              onActivity={pushActivity}
            />
          )}
          {tab === "invoices" && (
            <InvoicesTab
              invoices={invoices}
              setInvoices={setInvoices}
              currency={live.currency}
              onActivity={pushActivity}
            />
          )}
          {tab === "messages" && (
            <MessagesTab
              projectSlug={live.slug}
              onActivity={pushActivity}
            />
          )}
        </div>
      </div>

      <TaskDetailPopup
        task={tasks.find((t) => t.id === detailTaskId) ?? null}
        open={Boolean(detailTaskId)}
        onClose={() => setDetailTaskId(null)}
        onSave={(next) => {
          const prev = tasks;
          setTasks((list) => list.map((t) => (t.id === next.id ? next : t)));
          notifyProjectsChanged();
          void backgroundSync().then((r) => {
            if (!r.ok) {
              setTasks(prev);
              toast?.error("Couldn't save the task. Try again.");
            }
          });
        }}
        onDelete={(id) => {
          setDetailTaskId(null);
          setDetailDeleteId(id);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(detailDeleteId)}
        onClose={() => setDetailDeleteId(null)}
        onConfirm={() => {
          if (!detailDeleteId) return;
          const prev = tasks;
          const id = detailDeleteId;
          setTasks((list) => list.filter((t) => t.id !== id));
          setDetailDeleteId(null);
          if (detailTaskId === id) setDetailTaskId(null);
          notifyProjectsChanged();
          void backgroundSync().then((r) => {
            if (!r.ok) {
              setTasks(prev);
              toast?.error("Couldn't delete the task. Try again.");
            }
          });
        }}
        title="Delete this task?"
        description="This will remove the task from the project."
        confirmLabel="Delete Task"
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDeleteProject}
        title={`Delete ${live.name}?`}
        description="This permanently removes the project from your workspace. This cannot be undone."
        confirmLabel="Delete Project"
      />
    </div>
  );
}
