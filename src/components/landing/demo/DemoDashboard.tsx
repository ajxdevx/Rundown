"use client";

import { formatDemoMoney } from "@/data/demoWorkspace";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  StatusBadge,
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
} from "@/components/ui/StatusBadge";
import { useDemoState } from "./DemoStateProvider";
import { DemoTopBar } from "./DemoTopBar";
import { ixRow } from "../motion/interaction";

export function DemoDashboard() {
  const {
    workspace,
    projects,
    activity,
    invoices,
    openProject,
    setCreateModalOpen,
  } = useDemoState();

  const active = projects.filter(
    (p) => p.status === "active" || p.status === "review",
  );
  const outstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const collected = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DemoTopBar
        title={`Good afternoon, ${workspace.ownerFirstName}`}
        context="Dashboard"
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat label="Active projects" value={String(active.length)} />
          <Stat label="Clients" value={String(new Set(projects.map((p) => p.clientId)).size)} />
          <Stat
            label="Outstanding"
            value={formatDemoMoney(outstanding, workspace.currency)}
          />
          <Stat
            label="Collected"
            value={formatDemoMoney(collected, workspace.currency)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[var(--radius-md)] border border-border bg-background p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Active projects</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="text-xs font-medium text-muted hover:text-ink"
              >
                New project
              </button>
            </div>
            <ul className="space-y-2">
              {active.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => openProject(project.id)}
                    className={`${ixRow} w-full p-3`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {project.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {project.clientName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge
                          label={project.status}
                          tone={projectStatusTone(project.status)}
                          icon={projectStatusIcon(project.status)}
                        />
                      </div>
                    </div>
                    <ProgressBar
                      className="mt-3"
                      value={project.progress}
                      meta={`${project.progress}%`}
                    />
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span>Current: {project.currentTask}</span>
                      <span>{project.deadlineLabel}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-border bg-background p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-ink">Payments</h3>
              <ul className="mt-3 space-y-2">
                {invoices.slice(0, 4).map((inv) => {
                  const project = projects.find((p) => p.id === inv.projectId);
                  return (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {inv.number}
                        </p>
                        <p className="truncate text-muted">
                          {project?.clientName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium text-ink">
                          {formatDemoMoney(inv.amount, workspace.currency)}
                        </p>
                        <StatusBadge
                          label={inv.status}
                          tone={paymentStatusTone(inv.status)}
                          icon={paymentStatusIcon(inv.status)}
                          className="mt-0.5"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-[var(--radius-md)] border border-border bg-background p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-ink">Activity</h3>
              <ul className="mt-3 space-y-2.5">
                {activity.slice(0, 5).map((item) => (
                  <li key={item.id} className="text-xs">
                    <p className="font-medium text-ink">{item.description}</p>
                    <p className="text-muted-soft">{item.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-background px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink sm:text-base">
        {value}
      </p>
    </div>
  );
}
