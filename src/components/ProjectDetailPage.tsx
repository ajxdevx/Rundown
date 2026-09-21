"use client";

import {
  Archive,
  Check,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileArchive,
  FileImage,
  FileText,
  FolderKanban,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyProjectDetail,
  type ProjectActivity,
  type ProjectDetail,
  type ProjectFile,
  type ProjectInvoice,
  type ProjectMessage,
  type ProjectStatus,
  type ProjectTask,
} from "@/data/projectDetailMock";
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
import type { ProjectFormEditValues } from "@/components/ProjectFormModal";
import ActivityList from "./ActivityList";
import ClientVisibleToggle from "./ClientVisibleToggle";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ContextMenu from "./ContextMenu";
import DashboardTopBar from "./DashboardTopBar";
import Dropdown from "./Dropdown";
import { ProjectNotFound } from "./EdgeStates";
import EmptyState from "./EmptyState";
import Popup, { PopupCloseButton } from "./Popup";
import SharePortalModal from "./SharePortalModal";
import { ProjectDetailSkeleton } from "./skeletons";
import { useToastOptional } from "./ToastProvider";
import { ProgressBar } from "./ui/ProgressBar";
import {
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  StatusBadge,
} from "./ui/StatusBadge";

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
  switch (state) {
    case "paid":
      return "Paid";
    case "due":
      return "Due";
    case "overdue":
      return "Overdue";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
  }
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

function OverviewTab({
  project,
  tasks,
  onGoTasks,
  onGoInvoices,
  onCopyLink,
  onSharePortal,
  onEdit,
}: {
  project: ProjectDetail;
  tasks: ProjectTask[];
  onGoTasks: () => void;
  onGoInvoices: () => void;
  onCopyLink: () => void;
  onSharePortal: () => void;
  onEdit: () => void;
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
  const nextTasks = tasks.filter((t) => !t.done).slice(0, 3);
  const visibleTasks = tasks.filter((t) => t.visibleToClient).length;
  const sharedParts = [
    visibleTasks > 0 ? "Tasks" : null,
    "Files",
    "Messages",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <section className="card-surface p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Deadline
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${
                project.overdue ? "text-danger" : "text-ink"
              }`}
            >
              {project.deadlineRelative}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Value
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {formatMoney(project.value, project.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Payment
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight sm:text-3xl ${moneyToneClass("paid")}`}
            >
              {formatMoney(project.paid, project.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Project Progress
          </p>
          {total === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Check}
                title="No tasks yet"
                description="Add tasks to start tracking project progress."
                action={{ label: "Add Task", onClick: onGoTasks, icon: Plus }}
                compact
              />
            </div>
          ) : (
            <>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {progress}%
              </p>
              <ProgressBar
                value={progress}
                className="mt-5"
                meta={
                  progress >= 100
                    ? "All project tasks completed."
                    : `${done} of ${total} tasks completed`
                }
              />
            </>
          )}
        </div>
      </section>

      <section className="card-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Next Up
        </p>
        {nextTasks.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {nextTasks.map((task, i) => (
              <li
                key={task.id}
                className={
                  i < nextTasks.length - 1 ? "border-b border-border pb-3" : ""
                }
              >
                <h3 className="text-base font-semibold text-ink">{task.name}</h3>
                {task.description ? (
                  <p className="mt-0.5 text-sm text-muted">{task.description}</p>
                ) : null}
                <p className="mt-1 text-xs font-medium text-muted-soft">
                  {i === 0 ? "Next task" : "Upcoming"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <h3 className="mt-3 text-lg font-semibold text-ink">
              You&apos;re all caught up
            </h3>
            <p className="mt-1 text-sm text-muted">
              There are no outstanding tasks for this project.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={onGoTasks}
          className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
        >
          {nextTasks.length > 0 ? "View Tasks" : "Add Task"}
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Project Information
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Client</dt>
              <dd className="font-medium text-ink">
                {project.clientId && project.client ? (
                  <Link
                    href={`/clients/${project.clientId}`}
                    className="hover:underline"
                  >
                    {project.client}
                  </Link>
                ) : (
                  "No client"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium text-ink">
                {statusLabel(project.status)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Created</dt>
              <dd className="font-medium text-ink">{project.createdAt}</dd>
            </div>
          </dl>
        </section>

        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Payment
          </p>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Total</span>
              <span className="font-semibold text-ink">
                {formatMoney(project.value, project.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Paid</span>
              <span
                className={`font-semibold ${moneyToneClass("paid")}`}
              >
                {formatMoney(project.paid, project.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-sm">
              <span className="text-muted">Outstanding</span>
              <span
                className={`font-semibold ${moneyToneClass(
                  project.remaining > 0 ? "outstanding" : "paid",
                )}`}
              >
                {formatMoney(project.remaining, project.currency)}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge
              label={paymentLabel(project.paymentState)}
              tone={paymentStatusTone(project.paymentState)}
              icon={paymentStatusIcon(project.paymentState)}
            />
          </div>
          <button
            type="button"
            onClick={onGoInvoices}
            className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
          >
            View Invoices
          </button>
        </section>
      </div>

      <section className="card-surface overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Recent Activity
          </p>
          {activity.length > 0 ? (
            <Link
              href={`/activity?project=${encodeURIComponent(project.slug)}`}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              View all activity
            </Link>
          ) : null}
        </div>
        <div className="mt-3">
          <ActivityList
            items={activity}
            limit={6}
            showGroups={false}
            compact
            bare
            emptyTitle="No activity yet"
            emptyDescription="Project activity will appear here as work gets moving."
          />
        </div>
      </section>

      <section className="card-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Client Portal
          </p>
          <StatusBadge
            label="Active"
            tone={projectStatusTone("active")}
            icon={projectStatusIcon("active")}
          />
        </div>
        <p className="mt-3 text-sm text-ink">
          Visible to client:{" "}
          {sharedParts.length > 0 ? sharedParts.join(", ") : "Nothing yet"}
        </p>
        <p className="mt-1 text-sm text-muted">
          Last viewed {project.lastPortalView}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={
              project.portalUrl.startsWith("http")
                ? project.portalUrl
                : typeof window !== "undefined"
                  ? `${window.location.origin}${project.portalUrl}`
                  : project.portalUrl
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] btn-primary px-3.5 text-sm font-medium"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            Open Portal
          </a>
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            Copy Link
          </button>
          <button
            type="button"
            onClick={onSharePortal}
            className="inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
          >
            Share Portal
          </button>
        </div>
      </section>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Project Summary
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-muted hover:text-ink"
          >
            Edit Project
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          {project.description || "No project description"}
        </p>
      </section>
    </div>
  );
}

function TasksTab({
  tasks,
  setTasks,
  onActivity,
}: {
  tasks: ProjectTask[];
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const toast = useToastOptional();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const { done, total, progress } = progressFromTasks(tasks);

  const syncFail = (msg: string) => toast?.error(msg);

  const toggleDone = (id: string) => {
    const prev = tasks;
    const task = tasks.find((t) => t.id === id);
    const nextDone = task ? !task.done : false;
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
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

  const toggleVisible = (id: string, next: boolean) => {
    const prev = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, visibleToClient: next } : t)),
    );
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't update this setting.");
      }
    });
  };

  const addTask = () => {
    const n = name.trim();
    if (!n) return;
    const prev = tasks;
    const task: ProjectTask = {
      id: `task_${Date.now()}`,
      name: n,
      description: description.trim() || undefined,
      done: false,
      visibleToClient: visible,
    };
    setTasks((list) => [...list, task]);
    setName("");
    setDescription("");
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

  const startEdit = (task: ProjectTask) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditDescription(task.description || "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const n = editName.trim();
    if (!n) return;
    const prev = tasks;
    setTasks((list) =>
      list.map((t) =>
        t.id === editingId
          ? {
              ...t,
              name: n,
              description: editDescription.trim() || undefined,
            }
          : t,
      ),
    );
    setEditingId(null);
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't update the task. Try again.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const prev = tasks;
    setTasks((list) => list.filter((t) => t.id !== deleteId));
    notifyProjectsChanged();
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't delete the task. Try again.");
      }
    });
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const prev = tasks;
    setTasks((list) => {
      const from = list.findIndex((t) => t.id === dragId);
      const to = list.findIndex((t) => t.id === targetId);
      if (from < 0 || to < 0) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragId(null);
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't reorder tasks. Try again.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="section-title">Tasks</h3>
          <p className="mt-0.5 text-sm text-muted">
            {done} of {total} completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Add Task
        </button>
      </div>

      {adding ? (
        <div className="card-surface space-y-3 p-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Task name
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name"
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
              placeholder="Description (optional)"
              rows={2}
              className="w-full resize-none rounded-[8px] border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink"
            />
          </label>
          <ClientVisibleToggle visible={visible} onChange={setVisible} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addTask}
              className="h-9 rounded-[8px] btn-primary px-4 text-sm font-medium"
            >
              Add Task
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-9 rounded-[8px] border border-border px-4 text-sm font-medium text-muted hover-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            icon={Check}
            title="No tasks yet"
            description="Add tasks to start tracking project progress."
            action={{
              label: "Add Task",
              icon: Plus,
              onClick: () => setAdding(true),
            }}
            compact
          />
        </div>
      ) : (
        <>
          <ul className="card-surface overflow-hidden">
            {tasks.map((task, index) => (
              <li
                key={task.id}
                draggable
                onDragStart={() => setDragId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(task.id)}
                className={`flex items-start gap-2 px-3 py-3 sm:gap-3 sm:px-4 ${
                  index < tasks.length - 1 ? "border-b border-border" : ""
                } ${dragId === task.id ? "opacity-60" : ""}`}
              >
                <span
                  className="mt-0.5 cursor-grab text-muted-soft"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="size-4" strokeWidth={1.75} />
                </span>
                <button
                  type="button"
                  onClick={() => toggleDone(task.id)}
                  aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                  className={`mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border transition-colors ${
                    task.done
                      ? "border-ink bg-ink text-card"
                      : "border-border bg-transparent text-transparent hover:border-ink"
                  }`}
                >
                  <Check className="size-3" strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  {editingId === task.id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field"
                        aria-label="Edit task name"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-[8px] border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
                        aria-label="Edit task description"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="h-8 rounded-[8px] btn-primary px-3 text-xs font-semibold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="h-8 rounded-[8px] border border-border px-3 text-xs font-medium text-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`text-sm font-medium ${
                          task.done ? "text-muted line-through" : "text-ink"
                        }`}
                      >
                        {task.name}
                      </p>
                      {task.description ? (
                        <p className="mt-0.5 text-xs text-muted">
                          {task.description}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
                <ClientVisibleToggle
                  visible={task.visibleToClient}
                  onChange={(next) => toggleVisible(task.id, next)}
                />
                <button
                  type="button"
                  aria-label="Edit task"
                  onClick={() => startEdit(task)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                >
                  <Pencil className="size-4" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label="Delete task"
                  onClick={() => setDeleteId(task.id)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft hover:text-danger"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
          <div className="card-surface px-5 py-4">
            <ProgressBar
              value={progress}
              meta={`${done}/${total} · ${progress}% complete`}
            />
          </div>
        </>
      )}

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
  onActivity,
}: {
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const toast = useToastOptional();
  const [files, setFiles] = useState<FileRow[]>([]);
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
              className="h-9 rounded-[8px] btn-primary px-4 text-sm font-medium"
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
                      label={
                        inv.status.charAt(0).toUpperCase() + inv.status.slice(1)
                      }
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
  onActivity,
}: {
  onActivity?: (text: string, category: ProjectActivity["category"]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>([]);
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

  return {
    project: {
      id: created.id,
      slug: created.slug,
      name: created.name,
      client: created.clientName || "No client",
      clientId: created.clientId || "",
      clientEmail: created.clientEmail,
      description: created.description,
      status: created.status === "draft" ? "draft" : "active",
      value: created.value ?? 0,
      currency: created.currency,
      paid: 0,
      remaining: created.value ?? 0,
      paymentState: created.value && created.value > 0 ? "due" : "paid",
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
      deadlineLabel: created.deadline || "No deadline set",
      deadlineRelative: created.deadline ? "Deadline set" : "No deadline set",
      daysRemaining: 0,
      overdue: false,
      nextUp: next
        ? { title: next.name, description: created.description || "" }
        : null,
      portalUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${created.portalPath}`,
      lastPortalView: "Never",
      createdAt: "Just now",
      updatedAt: "Just now",
    },
    tasks: created.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      done: t.done,
      visibleToClient: t.visibleToClient,
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
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
      setInvoices([]);
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
      deadlineRelative: values.deadline || "No deadline set",
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

      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="page-title">{live.name}</h1>
              <StatusBadge
                label={statusLabel(live.status)}
                tone={projectStatusTone(live.status)}
                icon={projectStatusIcon(live.status)}
              />
              <StatusBadge
                label={paymentLabel(live.paymentState)}
                tone={paymentStatusTone(live.paymentState)}
                icon={paymentStatusIcon(live.paymentState)}
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
              <p className="mt-1.5 text-sm text-muted">No client</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-accent px-4 text-sm font-semibold"
            >
              Share Portal
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Project actions"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex size-10 cursor-pointer items-center justify-center rounded-[8px] text-muted ${
                  menuOpen ? "bg-surface text-ink" : "hover-soft"
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

        <div
          role="tablist"
          aria-label="Project sections"
          className="mt-6 flex gap-1 overflow-x-auto border-b border-border"
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
                className={`relative shrink-0 cursor-pointer px-4 py-3.5 text-sm font-medium transition-colors ${
                  selected ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {selected ? (
                  <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby={`tab-${tab}`} className="py-6">
          {tab === "overview" && (
            <OverviewTab
              project={live}
              tasks={tasks}
              onGoTasks={() => setTab("tasks")}
              onGoInvoices={() => setTab("invoices")}
              onCopyLink={() => void copyPortalLink()}
              onSharePortal={() => setShareOpen(true)}
              onEdit={openEditProject}
            />
          )}
          {tab === "tasks" && (
            <TasksTab
              tasks={tasks}
              setTasks={setTasks}
              onActivity={pushActivity}
            />
          )}
          {tab === "files" && <FilesTab onActivity={pushActivity} />}
          {tab === "invoices" && (
            <InvoicesTab
              invoices={invoices}
              setInvoices={setInvoices}
              currency={live.currency}
              onActivity={pushActivity}
            />
          )}
          {tab === "messages" && <MessagesTab onActivity={pushActivity} />}
        </div>
      </div>

      <SharePortalModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        portalUrl={portalAbsolute}
        projectName={live.name}
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
