"use client";

import { formatDemoMoney } from "@/data/demoWorkspace";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  StatusBadge,
  projectStatusIcon,
  projectStatusTone,
} from "@/components/ui/StatusBadge";
import { useDemoState } from "./DemoStateProvider";
import { DemoTopBar } from "./DemoTopBar";
import { ixRow } from "../motion/interaction";

export function DemoProjects() {
  const { projects, openProject, setCreateModalOpen, workspace } =
    useDemoState();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DemoTopBar title="Projects" context="Workspace" />
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {projects.length} projects in this demo
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="btn-accent h-8 px-3 text-xs font-medium"
          >
            Create project
          </button>
        </div>

        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => openProject(project.id)}
                className={`${ixRow} grid w-full grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {project.name}
                    </p>
                    <StatusBadge
                      label={project.status}
                      tone={projectStatusTone(project.status)}
                      icon={projectStatusIcon(project.status)}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {project.clientName} · {project.currentTask}
                  </p>
                  <ProgressBar
                    className="mt-2 max-w-sm"
                    value={project.progress}
                    meta={`${project.progress}%`}
                  />
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-ink">
                    {formatDemoMoney(project.value, workspace.currency)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatDemoMoney(project.paid, workspace.currency)} paid
                  </p>
                  <p className="mt-1 text-[11px] text-muted-soft">
                    {project.deadlineLabel}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
