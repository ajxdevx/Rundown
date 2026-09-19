"use client";

import {
  Archive,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  FileImage,
  FileText,
  GripVertical,
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
  projectActivity as seedActivity,
  projectDetail as seedProject,
  projectFiles as seedFiles,
  projectInvoices as seedInvoices,
  projectMessages as seedMessages,
  projectTasks as seedTasks,
  type ProjectDetail,
  type ProjectFile,
  type ProjectInvoice,
  type ProjectMessage,
  type ProjectStatus,
  type ProjectTask,
} from "@/data/projectDetailMock";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import {
  getCreatedProjectBySlug,
  removeCreatedProject,
  restoreCreatedProject,
} from "@/lib/createProject";
import { backgroundSync } from "@/lib/optimistic";
import ClientVisibleToggle from "./ClientVisibleToggle";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import DashboardTopBar from "./DashboardTopBar";
import { ProjectNotFound } from "./EdgeStates";
import EmptyState from "./EmptyState";
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

function fileIcon(type: ProjectFile["type"]) {
  if (type === "ZIP") return FileArchive;
  if (type === "IMG") return FileImage;
  return FileText;
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
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
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
    { id: "edit", label: "Edit Project", icon: Pencil, danger: false },
    { id: "duplicate", label: "Duplicate Project", icon: Copy, danger: false },
    { id: "copy", label: "Copy Portal Link", icon: Copy, danger: false },
    { id: "archive", label: "Archive Project", icon: Archive, danger: false },
    { id: "delete", label: "Delete Project", icon: Trash2, danger: true },
  ] as const;

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.danger ? <div className="my-1 border-t border-border" /> : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm font-medium ${
              item.danger
                ? "text-danger hover:bg-danger-soft"
                : "text-ink hover-soft"
            }`}
          >
            <item.icon className="size-4 opacity-70" strokeWidth={1.75} />
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({
  project,
  tasks,
  onGoTasks,
  onGoInvoices,
  onCopyLink,
}: {
  project: ProjectDetail;
  tasks: ProjectTask[];
  onGoTasks: () => void;
  onGoInvoices: () => void;
  onCopyLink: () => void;
}) {
  const { done, total, progress } = progressFromTasks(tasks);
  const next = tasks.find((t) => !t.done);
  const visibleCount = tasks.filter((t) => t.visibleToClient).length;

  return (
    <div className="space-y-5">
      <section className="card-surface p-5 sm:p-6">
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
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Next Up
          </p>
          {next ? (
            <>
              <h3 className="mt-3 text-lg font-semibold text-ink">{next.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {next.description ||
                  "The next thing to work on for this project."}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-soft">
                Next task
              </p>
              <button
                type="button"
                onClick={onGoTasks}
                className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
              >
                View Tasks
              </button>
            </>
          ) : (
            <>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                Everything is complete
              </h3>
              <p className="mt-1 text-sm text-muted">
                All project tasks have been completed.
              </p>
              <button
                type="button"
                onClick={onGoTasks}
                className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
              >
                Review Project
              </button>
            </>
          )}
        </section>

        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Deadline
          </p>
          {project.deadline ? (
            <>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                {project.deadline}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  project.overdue ? "font-medium text-danger" : "text-muted"
                }`}
              >
                {project.deadlineRelative}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-3 text-lg font-semibold text-ink">
                No deadline set
              </h3>
              <p className="mt-1 text-sm text-muted">
                Add a deadline to track delivery.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Payment
          </p>
          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Project value</span>
              <span className="font-semibold text-ink">
                {formatMoney(project.value, project.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Paid</span>
              <span className="font-semibold text-success">
                {formatMoney(project.paid, project.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-sm">
              <span className="text-muted">Remaining</span>
              <span className="font-semibold text-ink">
                {formatMoney(project.remaining, project.currency)}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge
              label={
                project.paymentState.charAt(0).toUpperCase() +
                project.paymentState.slice(1)
              }
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

        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Client Portal
          </p>
          <p className="mt-3 text-sm text-ink">
            Client can see {visibleCount} of {total || 0} tasks
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
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Recent Activity
            </p>
          </div>
          {seedActivity.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No activity yet"
              description="Project activity will appear here as work happens."
              compact
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {seedActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm text-ink">{item.text}</p>
                  <span className="shrink-0 text-xs text-muted-soft">
                    {item.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Project Details
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            {(
              [
                ["Client", project.client],
                ["Deadline", project.deadline || "Not set"],
                ["Project value", formatMoney(project.value, project.currency)],
                ["Currency", project.currency],
                ["Status", statusLabel(project.status)],
                ["Created", project.createdAt],
                ["Last updated", project.updatedAt],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {project.description || "No project description yet."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TasksTab({
  tasks,
  setTasks,
}: {
  tasks: ProjectTask[];
  setTasks: React.Dispatch<React.SetStateAction<ProjectTask[]>>;
}) {
  const toast = useToastOptional();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { done, total, progress } = progressFromTasks(tasks);

  const syncFail = (msg: string) => toast?.error(msg);

  const toggleDone = (id: string) => {
    const prev = tasks;
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
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
    setTasks((list) => list.filter((t) => t.id !== deleteId));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setTasks(prev);
        syncFail("Couldn't delete the task. Try again.");
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
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task name"
            className="input-field"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-[8px] border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink"
          />
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
            description="Add tasks to track project progress and optionally share milestones with your client."
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
                className={`flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 ${
                  index < tasks.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="cursor-grab text-muted-soft" aria-hidden>
                  <GripVertical className="size-4" strokeWidth={1.75} />
                </span>
                <button
                  type="button"
                  onClick={() => toggleDone(task.id)}
                  aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                  className={`flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border transition-colors ${
                    task.done
                      ? "border-ink bg-ink text-card"
                      : "border-border bg-transparent text-transparent hover:border-ink"
                  }`}
                >
                  <Check className="size-3" strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${
                      task.done ? "text-muted line-through" : "text-ink"
                    }`}
                  >
                    {task.name}
                  </p>
                </div>
                <ClientVisibleToggle
                  visible={task.visibleToClient}
                  onChange={(next) => toggleVisible(task.id, next)}
                />
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

function FilesTab() {
  const toast = useToastOptional();
  const [files, setFiles] = useState<FileRow[]>(
    seedFiles.map((f) => ({ ...f, uploadStatus: "ready" as const })),
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    <div className="space-y-5">
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
            description="Upload files to keep everything related to this project in one place."
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
                className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center ${
                  index < files.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
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
                      <p className="text-xs text-muted-soft">
                        {file.type} · {file.size} · {file.uploaded}
                      </p>
                    )}
                    {file.uploadStatus === "uploading" ? (
                      <div className="mt-2 h-1 w-36 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${file.uploadProgress ?? 0}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {file.uploadStatus === "failed" ? (
                    <button
                      type="button"
                      onClick={() => retryUpload(file.id)}
                      className="h-9 rounded-[8px] bg-surface px-3 text-xs font-semibold text-ink hover-soft"
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
                        className="flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                      >
                        <Download className="size-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete file"
                        onClick={() => setDeleteId(file.id)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
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
}: {
  invoices: ProjectInvoice[];
  setInvoices: React.Dispatch<React.SetStateAction<ProjectInvoice[]>>;
  currency: string;
}) {
  const toast = useToastOptional();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const markPaid = (id: string) => {
    const prev = invoices;
    setInvoices((list) =>
      list.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              status: "paid" as const,
              paid: inv.amount,
              remaining: 0,
            }
          : inv,
      ),
    );
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setInvoices(prev);
        toast?.error("Couldn't update invoice.");
      }
    });
  };

  const createInvoice = () => {
    const prev = invoices;
    const inv: ProjectInvoice = {
      id: `inv_${Date.now()}`,
      number: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      title: "New invoice",
      amount: 500,
      due: "Oct 30",
      paid: 0,
      remaining: 500,
      status: "due",
      hasPaymentLink: false,
    };
    setInvoices((list) => [inv, ...list]);
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
          onClick={createInvoice}
          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[8px] btn-accent px-4 text-sm font-semibold"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Create Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create an invoice to track payments for this project."
            action={{
              label: "Create Invoice",
              icon: Plus,
              onClick: createInvoice,
            }}
            compact
          />
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <article key={inv.id} className="card-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-ink">{inv.number}</p>
                  <p className="mt-0.5 text-sm text-muted">{inv.title}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-semibold text-ink">
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
      )}

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

function MessagesTab() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<LocalMessage[]>(
    seedMessages.map((m) => ({ ...m, status: "sent" as const })),
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
    <div className="card-surface flex min-h-[440px] flex-col overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="section-title">Messages</h3>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No messages yet"
          description="Start a conversation with your client about this project."
          compact
        />
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
                  className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-sm leading-relaxed ${
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

      <div className="flex items-center gap-2 border-t border-border p-4">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a message..."
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold disabled:opacity-50"
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
      ...seedProject,
      id: created.id,
      slug: created.slug,
      name: created.name,
      client: created.clientName,
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
  const loading = useInitialLoading(400);
  const [ready, setReady] = useState(false);
  const [found, setFound] = useState(true);
  const [project, setProject] = useState<ProjectDetail>(seedProject);
  const [tasks, setTasks] = useState<ProjectTask[]>(seedTasks);
  const [invoices, setInvoices] = useState(seedInvoices);
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
    } else if (slug.toLowerCase() === seedProject.slug.toLowerCase()) {
      setProject({
        ...seedProject,
        portalUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/p/acme-website`
            : seedProject.portalUrl,
      });
      setTasks(seedTasks);
      setInvoices(seedInvoices);
      setIsCreated(false);
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
    };
  }, [project, tasks, invoices]);

  const portalAbsolute =
    live.portalUrl.startsWith("http")
      ? live.portalUrl
      : `${typeof window !== "undefined" ? window.location.origin : ""}${live.portalUrl}`;

  const copyPortalLink = async () => {
    try {
      await navigator.clipboard.writeText(portalAbsolute);
      toast?.success("Portal link copied");
    } catch {
      toast?.error("Couldn't copy the portal link. Try again.");
    }
  };

  const onMenuAction = (action: string) => {
    if (action === "copy") {
      void copyPortalLink();
      return;
    }
    if (action === "archive") {
      const prev = live.status;
      setProject((p) => ({ ...p, status: "archived" }));
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
      toast?.success("Project duplicated");
      return;
    }
    if (action === "edit") {
      toast?.success("Edit opens inline — coming with forms polish");
    }
  };

  const confirmDeleteProject = () => {
    const snapshot = isCreated ? getCreatedProjectBySlug(live.slug) : null;
    if (isCreated && snapshot) removeCreatedProject(snapshot.id);
    router.push("/projects");
    void backgroundSync().then((r) => {
      if (!r.ok && snapshot) {
        restoreCreatedProject(snapshot);
        toast?.error("Couldn't delete the project. Try again.");
        router.push(`/projects/${snapshot.slug}`);
      }
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
        <DashboardTopBar />
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
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="page-title">{live.name}</h1>
              <StatusBadge
                label={statusLabel(live.status)}
                tone={projectStatusTone(live.status)}
                icon={projectStatusIcon(live.status)}
              />
            </div>
            <Link
              href={`/clients/${live.clientId}`}
              className="mt-1.5 inline-block text-sm text-muted hover:text-ink"
            >
              {live.client}
            </Link>
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
              />
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Deadline</p>
            <p
              className={`mt-0.5 text-sm font-medium ${
                live.overdue ? "text-danger" : "text-ink"
              }`}
            >
              {live.deadlineRelative}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Project value</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {formatMoney(live.value, live.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Progress</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {live.progress}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Payment</p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {formatMoney(live.paid, live.currency)} paid
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Project sections"
          className="mt-1 flex gap-1 overflow-x-auto border-b border-border"
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

        <div
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="py-6"
        >
          {tab === "overview" && (
            <OverviewTab
              project={live}
              tasks={tasks}
              onGoTasks={() => setTab("tasks")}
              onGoInvoices={() => setTab("invoices")}
              onCopyLink={() => void copyPortalLink()}
            />
          )}
          {tab === "tasks" && <TasksTab tasks={tasks} setTasks={setTasks} />}
          {tab === "files" && <FilesTab />}
          {tab === "invoices" && (
            <InvoicesTab
              invoices={invoices}
              setInvoices={setInvoices}
              currency={live.currency}
            />
          )}
          {tab === "messages" && <MessagesTab />}
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
        description="This permanently removes the project and its associated project data."
        confirmLabel="Delete Project"
      />
    </div>
  );
}
