"use client";

import { ExternalLink } from "lucide-react";
import type { DemoProjectTab } from "@/data/demoWorkspace";
import { formatDemoMoney, paymentAmountClass } from "@/data/demoWorkspace";
import { useToast } from "@/components/ToastProvider";
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
import { ixTab } from "../motion/interaction";

const TABS: { id: DemoProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
  { id: "invoices", label: "Invoices" },
  { id: "messages", label: "Messages" },
];

export function DemoProjectDetail() {
  const {
    selectedProject,
    projectTab,
    setProjectTab,
    projectTasks,
    projectFiles,
    projectInvoices,
    projectMessages,
    messageDraft,
    setMessageDraft,
    completeTask,
    markInvoicePaid,
    sendMessage,
    openPortal,
    copyPortalLink,
    navigate,
    workspace,
  } = useDemoState();
  const toast = useToast();

  if (!selectedProject) {
    return (
      <div className="flex h-full flex-col">
        <DemoTopBar title="Project" context="Projects" />
        <div className="flex flex-1 items-center justify-center p-6">
          <button
            type="button"
            onClick={() => navigate("projects")}
            className="text-sm font-medium text-ink underline-offset-2 hover:underline"
          >
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DemoTopBar title={selectedProject.name} context="Project" />

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => navigate("projects")}
          className="text-xs font-medium text-muted hover:text-ink"
        >
          ← Projects
        </button>
        <StatusBadge
          label={selectedProject.status}
          tone={projectStatusTone(selectedProject.status)}
          icon={projectStatusIcon(selectedProject.status)}
        />
        <span className="text-xs text-muted">{selectedProject.clientName}</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              copyPortalLink();
              toast.success("Portal link copied");
            }}
            className="btn-secondary h-8 px-2.5 text-xs font-medium"
          >
            Copy portal link
          </button>
          <button
            type="button"
            onClick={() => openPortal(selectedProject.id)}
            className="btn-accent inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium"
          >
            Open Portal
            <ExternalLink className="size-3" aria-hidden />
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Project sections"
        className="flex gap-0.5 overflow-x-auto border-b border-border px-2 sm:px-3"
      >
        {TABS.map((tab) => {
          const selected = projectTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`demo-tab-${tab.id}`}
              onClick={() => setProjectTab(tab.id)}
              className={ixTab(selected)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`demo-tab-${projectTab}`}
        className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"
      >
        {projectTab === "overview" ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted">
              {selectedProject.description}
            </p>
            <ProgressBar
              value={selectedProject.progress}
              label="Progress"
              meta={`${selectedProject.progress}%`}
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Current task" value={selectedProject.currentTask} />
              <Info label="Deadline" value={selectedProject.deadlineLabel} />
              <Info
                label="Value"
                value={formatDemoMoney(
                  selectedProject.value,
                  workspace.currency,
                )}
              />
              <Info
                label="Collected"
                value={formatDemoMoney(
                  selectedProject.paid,
                  workspace.currency,
                )}
              />
            </div>
          </div>
        ) : null}

        {projectTab === "tasks" ? (
          <ul className="space-y-2">
            {projectTasks.map((task) => {
              const done = task.status === "completed";
              return (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        done ? "text-muted line-through" : "text-ink"
                      }`}
                    >
                      {task.name}
                    </p>
                    <p className="text-[11px] capitalize text-muted-soft">
                      {task.status.replace("-", " ")}
                      {!task.clientVisible ? " · Internal" : ""}
                    </p>
                  </div>
                  {done ? (
                    <StatusBadge label="Done" tone="success" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        completeTask(task.id);
                        toast.success("Task completed");
                      }}
                      className="btn-secondary h-8 shrink-0 px-2.5 text-xs font-medium"
                    >
                      Complete
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        {projectTab === "files" ? (
          <ul className="space-y-2">
            {projectFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {file.name}
                    </p>
                    <StatusBadge
                      label={file.clientVisible ? "Shared" : "Internal"}
                      tone={file.clientVisible ? "lime" : "neutral"}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">{file.meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("File opened", file.name)}
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {projectTab === "invoices" ? (
          <ul className="space-y-2">
            {projectInvoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{inv.number}</p>
                  <p className="text-[11px] text-muted">{inv.dateLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${paymentAmountClass(inv.status)}`}
                  >
                    {formatDemoMoney(inv.amount, workspace.currency)}
                  </p>
                  <StatusBadge
                    label={inv.status}
                    tone={paymentStatusTone(inv.status)}
                    icon={paymentStatusIcon(inv.status)}
                  />
                  {inv.status !== "paid" ? (
                    <button
                      type="button"
                      onClick={() => {
                        markInvoicePaid(inv.id);
                        toast.success("Invoice marked as paid");
                      }}
                      className="btn-accent h-8 px-2.5 text-xs font-medium"
                    >
                      Mark as Paid
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {projectTab === "messages" ? (
          <div className="flex h-full min-h-[240px] flex-col">
            <ul className="flex-1 space-y-2.5 overflow-y-auto">
              {projectMessages.map((msg) => (
                <li
                  key={msg.id}
                  className={`max-w-[90%] rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                    msg.author === "business"
                      ? "ml-auto bg-accent text-ink"
                      : "bg-background text-ink ring-1 ring-border"
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted">
                    {msg.authorName} · {msg.time}
                    {!msg.clientVisible ? " · Internal" : ""}
                  </p>
                  <p className="mt-0.5 leading-relaxed">{msg.body}</p>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2 border-t border-border pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!messageDraft.trim()) return;
                sendMessage();
                toast.success("Message sent");
              }}
            >
              <label htmlFor="demo-message" className="sr-only">
                Message
              </label>
              <input
                id="demo-message"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                placeholder="Write a message…"
                className="input-field flex-1"
              />
              <button
                type="submit"
                className="btn-secondary h-11 shrink-0 px-4 text-sm font-medium"
              >
                Send
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-soft">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}
