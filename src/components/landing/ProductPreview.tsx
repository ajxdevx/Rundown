"use client";

import {
  Bell,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  Search,
  Users,
} from "lucide-react";
import {
  DEMO_WORKSPACE,
  INITIAL_DEMO_ACTIVITY,
  INITIAL_DEMO_PROJECTS,
  INITIAL_DEMO_TASKS,
  formatDemoMoney,
} from "@/data/demoWorkspace";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  StatusBadge,
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
} from "@/components/ui/StatusBadge";

const project = INITIAL_DEMO_PROJECTS[0];
const tasks = INITIAL_DEMO_TASKS.filter((t) => t.projectId === project.id).slice(
  0,
  4,
);

/**
 * Static hero product shell — interactive system lives in InteractiveDemoContainer.
 */
export function ProductPreview({ framed = true }: { framed?: boolean }) {
  return (
    <div
      className={
        framed
          ? "overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[0_16px_48px_rgba(17,17,17,0.06)]"
          : "overflow-hidden bg-card"
      }
      aria-label="Dueso product preview"
    >
      <div className="flex min-h-[480px] sm:min-h-[560px]">
        <aside className="hidden w-[200px] shrink-0 border-r border-border bg-background p-3 sm:flex sm:flex-col">
          <div className="mb-4 flex items-center gap-2 px-2 pt-1">
            <span className="flex size-6 items-center justify-center rounded-md bg-ink text-[10px] font-bold text-card">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              Dueso
            </span>
          </div>
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
            Workspace
          </p>
          <div className="mb-4 rounded-md border border-border bg-card px-2.5 py-2">
            <p className="truncate text-xs font-medium text-ink">
              {DEMO_WORKSPACE.name}
            </p>
          </div>
          <nav className="flex flex-col gap-0.5 text-sm" aria-hidden>
            <PreviewNavItem icon={LayoutDashboard} label="Dashboard" active />
            <PreviewNavItem icon={FolderKanban} label="Projects" />
            <PreviewNavItem icon={Users} label="Clients" />
            <PreviewNavItem icon={CircleDollarSign} label="Billing" />
          </nav>
          <div className="mt-auto border-t border-border pt-3">
            <div className="flex items-center gap-2 px-1">
              <Avatar name={DEMO_WORKSPACE.ownerName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-ink">
                  {DEMO_WORKSPACE.ownerFirstName}
                </p>
                <p className="truncate text-[10px] text-muted-soft">Owner</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between gap-3 border-b border-border px-4">
            <div>
              <p className="text-xs text-muted">Dashboard</p>
              <p className="text-sm font-semibold text-ink">
                Good afternoon, {DEMO_WORKSPACE.ownerFirstName}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-muted">
              <span className="hidden items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs sm:inline-flex">
                <Search className="size-3.5" aria-hidden />
                Search
              </span>
              <span className="inline-flex size-8 items-center justify-center rounded-md">
                <Bell className="size-4" aria-hidden />
              </span>
            </div>
          </div>

          <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0 space-y-4">
              <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted">
                      Active project
                    </p>
                    <h3 className="mt-1 truncate text-base font-semibold text-ink">
                      {project.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {project.clientName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge
                      label={project.status}
                      tone={projectStatusTone(project.status)}
                      icon={projectStatusIcon(project.status)}
                    />
                    <StatusBadge
                      label="due"
                      tone={paymentStatusTone("due")}
                      icon={paymentStatusIcon("due")}
                    />
                  </div>
                </div>

                <ProgressBar
                  className="mt-4"
                  value={project.progress}
                  label="Progress"
                  meta={`${project.progress}%`}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-soft">Current task</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {project.currentTask}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-soft">Deadline</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {project.deadlineLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-soft">Collected</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {formatDemoMoney(project.paid, project.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-soft">INV-002</p>
                    <p className="mt-0.5 font-medium text-ink">
                      {formatDemoMoney(1200, project.currency)} due
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted">Tasks</p>
                <ul className="mt-3 space-y-2">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-ink">{task.name}</span>
                      <TaskStatus status={task.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="hidden min-w-0 space-y-4 lg:block">
              <div className="rounded-[var(--radius-md)] border border-border bg-background p-4">
                <p className="text-xs font-medium text-muted">Activity</p>
                <ul className="mt-3 space-y-3">
                  {INITIAL_DEMO_ACTIVITY.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-sm">
                      <p className="font-medium text-ink">{item.description}</p>
                      <p className="mt-0.5 text-xs text-muted-soft">
                        {item.time}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[var(--radius-md)] border border-accent/40 bg-accent-soft/60 p-4">
                <p className="text-xs font-medium text-ink">Client context</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
                  {project.clientName} can follow progress, review files, and pay
                  INV-002 from their portal — without seeing your internal
                  workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewNavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium ${
        active ? "bg-accent text-ink" : "text-muted"
      }`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </div>
  );
}

function TaskStatus({
  status,
}: {
  status: "completed" | "in-progress" | "upcoming";
}) {
  if (status === "completed") {
    return <StatusBadge label="Done" tone="success" />;
  }
  if (status === "in-progress") {
    return <StatusBadge label="In progress" tone="lime" />;
  }
  return <StatusBadge label="Upcoming" tone="neutral" />;
}
