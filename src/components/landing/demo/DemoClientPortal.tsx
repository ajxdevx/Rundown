"use client";

import {
  ArrowLeft,
  Download,
  FileText,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import type { DemoPortalSection } from "@/data/demoWorkspace";
import {
  formatDemoMoney,
  paymentAmountClass,
  portalTaskStatusLabel,
} from "@/data/demoWorkspace";
import { useToast } from "@/components/ToastProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  StatusBadge,
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
} from "@/components/ui/StatusBadge";
import { trackLanding } from "@/lib/landingAnalytics";
import { Cta } from "../Cta";
import { useWaitlistOptional } from "../waitlist";
import { ixIcon, ixTab } from "../motion/interaction";
import { DemoInvoiceModal } from "./DemoInvoiceModal";
import { useDemoState } from "./DemoStateProvider";

const SECTIONS: { id: DemoPortalSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "files", label: "Files" },
  { id: "payment", label: "Payment" },
  { id: "messages", label: "Messages" },
];

export function DemoClientPortal() {
  const {
    selectedProject,
    projectTasks,
    projectFiles,
    projectInvoices,
    portalMessages,
    portalClient,
    workspace,
    portalSection,
    setPortalSection,
    portalMessageDraft,
    setPortalMessageDraft,
    openProject,
    completeClientAction,
    sendPortalMessage,
    openInvoiceModal,
    resetDemo,
  } = useDemoState();
  const toast = useToast();
  const waitlist = useWaitlistOptional();

  if (!selectedProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <p className="text-sm font-medium text-ink">
          Couldn&apos;t load this project.
        </p>
        <p className="text-xs text-muted">
          Open a project from the workspace, then choose Open Portal.
        </p>
        <button
          type="button"
          onClick={() => openProject("p-website")}
          className="btn-secondary h-9 px-3 text-xs font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const visibleTasks = projectTasks.filter((t) => t.clientVisible);
  const visibleFiles = projectFiles.filter((f) => f.clientVisible);
  const completedVisible = visibleTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const dueInvoices = projectInvoices.filter((i) => i.status !== "paid");
  const nextActionTask =
    visibleTasks.find(
      (t) => t.clientAction && t.status !== "completed",
    ) ?? null;
  const nextUpTask =
    nextActionTask ??
    visibleTasks.find((t) => t.status === "in-progress") ??
    visibleTasks.find((t) => t.status === "upcoming") ??
    null;
  const firstName = portalClient?.contactFirstName ?? "there";

  const show = (section: DemoPortalSection) =>
    portalSection === "overview" || portalSection === section;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Portal header — no internal workspace chrome */}
      <header className="shrink-0 border-b border-border bg-card px-3 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
              unoptimized
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {workspace.name}
              </p>
              <p className="text-[11px] font-medium text-muted">Client Portal</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge
              label={selectedProject.status}
              tone={projectStatusTone(selectedProject.status)}
              icon={projectStatusIcon(selectedProject.status)}
            />
            <a
              href="#portal-contact"
              className={`${ixIcon} size-8`}
              aria-label="Help and contact"
              onClick={(e) => {
                e.preventDefault();
                setPortalSection("overview");
                requestAnimationFrame(() => {
                  document
                    .getElementById("portal-contact")
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                });
              }}
            >
              <HelpCircle className="size-4" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => openProject(selectedProject.id)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simple portal nav */}
      <nav
        aria-label="Portal sections"
        className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border bg-card px-2 sm:px-3"
      >
        {SECTIONS.map((section) => {
          const active = portalSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setPortalSection(section.id)}
              className={ixTab(active)}
              aria-current={active ? "page" : undefined}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl space-y-5 px-3 py-5 sm:px-5">
          {/* Hero */}
          {(portalSection === "overview" || portalSection === "tasks") && (
            <section aria-labelledby="portal-hero-heading">
              <h1
                id="portal-hero-heading"
                className="font-[family-name:var(--font-brand)] text-xl font-semibold tracking-tight text-ink sm:text-2xl"
              >
                {selectedProject.name}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Hi {firstName}, here&apos;s where everything stands.
              </p>

              <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-card p-4">
                <ProgressBar
                  value={selectedProject.progress}
                  label="Project progress"
                  meta={`${selectedProject.progress}%`}
                />
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span>{selectedProject.deadlineLabel}</span>
                  <span>
                    {completedVisible}/{visibleTasks.length} visible tasks done
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Next Up */}
          {show("overview") || show("tasks") ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-next-up"
            >
              <h2
                id="portal-next-up"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft"
              >
                Next up
              </h2>
              {nextUpTask ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {nextActionTask
                      ? nextActionTask.clientAction === "review"
                        ? `Review the latest ${selectedProject.name.toLowerCase()} work`
                        : nextActionTask.clientAction === "approve"
                          ? `Approve ${nextActionTask.name.toLowerCase()}`
                          : nextActionTask.name
                      : nextUpTask.name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {nextActionTask?.clientActionHint ??
                      (nextUpTask.status === "in-progress"
                        ? "The team is working on this step now."
                        : "Coming up next on your project.")}
                  </p>
                  {nextActionTask?.clientAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        completeClientAction(nextActionTask.id);
                        toast.success(
                          nextActionTask.clientAction === "approve"
                            ? "Approved"
                            : nextActionTask.clientAction === "feedback"
                              ? "Feedback sent"
                              : "Review complete",
                        );
                      }}
                      className="btn-accent mt-3 h-9 px-3 text-xs font-medium"
                    >
                      {nextActionTask.clientActionLabel ?? "Continue"}
                    </button>
                  ) : (
                    <p className="mt-3 text-xs text-muted-soft">
                      You&apos;re all caught up on client actions for now.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">You&apos;re all caught up.</p>
              )}
            </section>
          ) : null}

          {/* What's happening */}
          {show("tasks") ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-happening"
            >
              <h2
                id="portal-happening"
                className="text-sm font-semibold text-ink"
              >
                What&apos;s happening
              </h2>
              {visibleTasks.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  You&apos;re all caught up.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {visibleTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span
                        className={
                          task.status === "completed"
                            ? "text-muted line-through"
                            : "font-medium text-ink"
                        }
                      >
                        {task.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-soft">
                        {portalTaskStatusLabel(task)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* Files */}
          {show("files") ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-files"
            >
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-4 text-muted" aria-hidden />
                <h2 id="portal-files" className="text-sm font-semibold text-ink">
                  Files
                </h2>
              </div>
              {visibleFiles.length === 0 ? (
                <p className="text-sm text-muted">
                  Files shared with you will appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {visibleFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted">{file.meta}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => toast.success("File opened", file.name)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-ink"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toast.success("Download started", file.name)
                          }
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-ink"
                        >
                          <Download className="size-3" aria-hidden />
                          Download
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {portalSection === "overview" ? (
                <p className="mt-3 text-[11px] text-muted-soft">
                  Internal files stay in the workspace — only shared files appear
                  here.
                </p>
              ) : null}
            </section>
          ) : null}

          {/* Payment */}
          {show("payment") ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-payment"
            >
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="size-4 text-muted" aria-hidden />
                <h2
                  id="portal-payment"
                  className="text-sm font-semibold text-ink"
                >
                  Project payment
                </h2>
              </div>
              {projectInvoices.length === 0 ? (
                <p className="text-sm text-muted">
                  Payment information will appear here when available.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(portalSection === "overview"
                    ? dueInvoices.length > 0
                      ? dueInvoices.slice(0, 2)
                      : projectInvoices.slice(0, 1)
                    : projectInvoices
                  ).map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {inv.number}
                        </p>
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
                        <button
                          type="button"
                          onClick={() => openInvoiceModal(inv.id)}
                          className={
                            inv.status === "paid"
                              ? "btn-secondary h-8 px-2.5 text-xs font-medium"
                              : "btn-accent h-8 px-2.5 text-xs font-medium"
                          }
                        >
                          {inv.status === "paid" ? "View Invoice" : "Pay Invoice"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {/* Messages */}
          {show("messages") ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-messages"
            >
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-muted" aria-hidden />
                <h2
                  id="portal-messages"
                  className="text-sm font-semibold text-ink"
                >
                  Messages
                </h2>
              </div>

              {portalMessages.length === 0 ? (
                <p className="mb-3 text-sm text-muted">
                  Start a conversation about your project.
                </p>
              ) : (
                <ul className="mb-3 max-h-48 space-y-2.5 overflow-y-auto">
                  {portalMessages.map((msg) => {
                    const isYou = msg.author === "client";
                    return (
                      <li
                        key={msg.id}
                        className={`max-w-[92%] rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                          isYou
                            ? "ml-auto bg-accent text-ink"
                            : "bg-background text-ink ring-1 ring-border"
                        }`}
                      >
                        <p className="text-[11px] font-medium text-muted">
                          {isYou
                            ? "You"
                            : `${msg.authorName.split(" ")[0]} — ${workspace.name}`}{" "}
                          · {msg.time}
                        </p>
                        <p className="mt-0.5 leading-relaxed">{msg.body}</p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <form
                className="flex gap-2 border-t border-border pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!portalMessageDraft.trim()) return;
                  sendPortalMessage();
                  toast.success("Message sent");
                  setPortalSection("messages");
                }}
              >
                <label htmlFor="portal-message" className="sr-only">
                  Write a message
                </label>
                <input
                  id="portal-message"
                  value={portalMessageDraft}
                  onChange={(e) => setPortalMessageDraft(e.target.value)}
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
            </section>
          ) : null}

          {/* Project details (overview) */}
          {portalSection === "overview" ? (
            <section
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
              aria-labelledby="portal-details"
            >
              <h2
                id="portal-details"
                className="text-sm font-semibold text-ink"
              >
                Project details
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] text-muted-soft">Status</dt>
                  <dd className="mt-0.5 font-medium capitalize text-ink">
                    {selectedProject.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-soft">Deadline</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {selectedProject.deadlineLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-soft">Project value</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {formatDemoMoney(
                      selectedProject.value,
                      workspace.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-soft">Collected</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {formatDemoMoney(selectedProject.paid, workspace.currency)}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          {/* Need anything */}
          {portalSection === "overview" ? (
            <section
              id="portal-contact"
              className="rounded-[var(--radius-md)] border border-border bg-card p-4"
            >
              <h2 className="text-sm font-semibold text-ink">Need anything?</h2>
              <p className="mt-1 text-sm text-muted">
                Have a question about this project?
              </p>
              <button
                type="button"
                onClick={() => setPortalSection("messages")}
                className="btn-secondary mt-3 h-9 px-3 text-xs font-medium"
              >
                Message {workspace.ownerFirstName}
              </button>
            </section>
          ) : null}

          {/* CTA after exploration */}
          <section className="rounded-[var(--radius-md)] border border-dashed border-border-strong bg-card/70 px-4 py-5 text-center">
            <p className="text-sm font-medium text-ink">
              This is the client experience Dueso creates for every project.
            </p>
            <p className="mt-1 text-xs text-muted">
              One workspace for your business. A focused portal for your clients.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Cta
                size="sm"
                onClick={() => {
                  trackLanding("portal_demo_interact", {
                    action: "cta_waitlist",
                  });
                  waitlist?.openWaitlist("client_portal");
                }}
              >
                Join Waitlist
              </Cta>
              <button
                type="button"
                onClick={() => openProject(selectedProject.id)}
                className="btn-secondary h-9 px-3 text-xs font-medium"
              >
                See Dueso in action
              </button>
            </div>
          </section>

          <footer className="pb-2 pt-1 text-center">
            <p className="text-[11px] text-muted-soft">{workspace.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-soft">
              {portalClient?.email ?? "hello@northline.demo"}
            </p>
            <p className="mt-2 text-[11px] text-muted-soft">
              Powered by Dueso · Demo experience
            </p>
            <button
              type="button"
              onClick={() => {
                resetDemo();
                toast.success("Demo reset");
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-ink"
            >
              <RotateCcw className="size-3" aria-hidden />
              Reset demo
            </button>
          </footer>
        </div>
      </div>

      <DemoInvoiceModal />
    </div>
  );
}
