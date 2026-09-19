"use client";

import {
  Check,
  Circle,
  Download,
  FileArchive,
  FileText,
  HelpCircle,
  Send,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  paymentStatusLabel,
  portalAccessOverride,
  portalBusiness,
  portalClient,
  portalFiles,
  portalInvoice,
  portalMessages,
  portalProgressFromTasks,
  portalProject,
  portalTasks,
  projectStatusLabel,
  type PortalMessage,
  type PortalTask,
} from "@/data/portalMock";
import {
  getCreatedProjectBySlug,
  SEED_PORTAL_SLUG,
} from "@/lib/createProject";
import { backgroundSync } from "@/lib/optimistic";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { PortalNotFound, PortalUnavailable } from "./EdgeStates";
import { PortalSkeleton } from "./skeletons";
import { ToastProvider, useToastOptional } from "./ToastProvider";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import {
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  StatusBadge,
} from "./ui/StatusBadge";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-sm font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border border-border bg-card ${className}`}
    >
      {children}
    </div>
  );
}

function BusinessLogo({
  src,
  name,
}: {
  src: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (failed || !src) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-ink text-xs font-semibold text-card"
        aria-hidden
      >
        {initials || "D"}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-[8px] object-contain"
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function taskStatusLabel(status: PortalTask["status"]) {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In progress";
  return "Upcoming";
}

type ClientPortalPageProps = {
  slug?: string;
};

function PortalContent({ slug }: ClientPortalPageProps) {
  const toast = useToastOptional();
  const loading = useInitialLoading(420);
  const [ready, setReady] = useState(false);
  const [access, setAccess] = useState<"ok" | "not-found" | "disabled">("ok");
  const [project, setProject] = useState({
    ...portalProject,
    greeting: portalProject.greeting,
    nextUp: {
      title: portalProject.nextUp.title,
      description: portalProject.nextUp.description,
      expectedUpdate: portalProject.nextUp.expectedUpdate ?? "",
    },
  });
  const [tasks, setTasks] = useState<PortalTask[]>(portalTasks);
  const [files, setFiles] = useState(portalFiles);
  const [invoice, setInvoice] = useState(portalInvoice);
  const [messages, setMessages] = useState<PortalMessage[]>(portalMessages);
  const [draft, setDraft] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filesError, setFilesError] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (portalAccessOverride) {
      setAccess(portalAccessOverride);
      setReady(true);
      return;
    }

    if (!slug) {
      setAccess("ok");
      setReady(true);
      return;
    }

    const created = getCreatedProjectBySlug(slug);
    if (created) {
      const visible = created.tasks.filter((t) => t.visibleToClient);
      const firstIncomplete = visible.findIndex((t) => !t.done);
      const mapped: PortalTask[] = visible.map((t, i) => ({
        id: t.id,
        name: t.name,
        status: t.done
          ? "completed"
          : i === firstIncomplete
            ? "in-progress"
            : "upcoming",
        description: t.done ? undefined : undefined,
      }));
      const { progress, completed, total } = portalProgressFromTasks(mapped);
      const current = mapped.find((t) => t.status === "in-progress");
      const allDone = total > 0 && completed === total;

      setProject({
        ...portalProject,
        id: created.id,
        slug: created.slug,
        name: created.name,
        client: created.clientName,
        status: created.status === "draft" ? "on-hold" : "active",
        deadline: created.deadline,
        deadlineLabel: created.deadline,
        deadlineRelative: "Due soon",
        value: created.value ?? 0,
        paid: 0,
        remaining: created.value ?? 0,
        paymentState: created.value && created.value > 0 ? "due" : "paid",
        progress,
        tasksCompleted: completed,
        tasksTotal: total,
        greeting: `Hi ${created.clientName.split(/\s+/)[0] || "there"}, here's the latest progress on your project.`,
        statusMessage:
          created.description ||
          "We're currently working on your project.",
        nextUp: allDone
          ? {
              title: "Everything is complete",
              description: "All project tasks have been completed.",
              expectedUpdate: "",
            }
          : current
            ? {
                title: current.name,
                description:
                  created.description ||
                  "We'll share the next update here soon.",
                expectedUpdate: "",
              }
            : {
                title: "No next step yet",
                description:
                  "We'll update this project when the next stage begins.",
                expectedUpdate: "",
              },
      });
      setTasks(mapped);
      setFiles([]);
      setInvoice(null);
      setMessages([]);
      setAccess("ok");
    } else if (
      slug.toLowerCase() === SEED_PORTAL_SLUG ||
      slug.toLowerCase() === portalProject.slug ||
      slug.toLowerCase() === "acme-website-redesign"
    ) {
      setAccess("ok");
    } else {
      setAccess("not-found");
    }
    setReady(true);
  }, [slug]);

  const { progress, completed, total } = useMemo(
    () => portalProgressFromTasks(tasks),
    [tasks],
  );

  const clientFacingStatus =
    project.status === "draft" || project.status === "archived"
      ? "active"
      : project.status;

  const paidPct =
    project.value > 0
      ? Math.round((project.paid / project.value) * 100)
      : 0;

  const scrollToMessages = () => {
    messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const el = document.getElementById("portal-message-input");
      el?.focus();
    }, 300);
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) return;
    const id = `local-${Date.now()}`;
    const optimistic: PortalMessage = {
      id,
      author: "client",
      name: portalClient.firstName,
      body,
      time: "Just now",
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    void backgroundSync({ failRate: 0.08 }).then((result) => {
      if (!result.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, failed: true } : m)),
        );
      }
    });
  };

  const retryMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, failed: false } : m)),
    );
    void backgroundSync().then((result) => {
      if (!result.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, failed: true } : m)),
        );
      }
    });
  };

  const downloadFile = (fileId: string, fileName: string) => {
    setDownloadingId(fileId);
    void backgroundSync({ delay: 350 }).then((result) => {
      setDownloadingId(null);
      if (!result.ok) {
        toast?.error("Couldn't download this file. Try again.");
        return;
      }
      const blob = new Blob(
        [`${fileName}\nShared via Dueso Client Portal`],
        { type: "text/plain" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (!ready || loading) {
    return <PortalSkeleton />;
  }

  if (access === "not-found") {
    return <PortalNotFound />;
  }

  if (access === "disabled") {
    return <PortalUnavailable />;
  }

  const allComplete = total > 0 && completed === total;
  const currentTask = tasks.find((t) => t.status === "in-progress");
  const showPay =
    invoice &&
    invoice.remaining > 0 &&
    invoice.hasPaymentLink &&
    invoice.status !== "paid" &&
    invoice.status !== "processing";

  return (
    <div className="min-h-full bg-background text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-4 px-6 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BusinessLogo
              src={portalBusiness.logoSrc}
              name={portalBusiness.name}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-ink">
                {portalBusiness.name}
              </p>
              <p className="text-[11px] font-medium text-muted">Client Portal</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge
              label={projectStatusLabel(clientFacingStatus)}
              tone={projectStatusTone(clientFacingStatus)}
              icon={projectStatusIcon(clientFacingStatus)}
              className="hidden sm:inline-flex"
            />
            <a
              href={`mailto:${portalBusiness.contactEmail}`}
              aria-label="Help and contact"
              className="flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-muted outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <HelpCircle className="size-4" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-10 px-6 py-8 sm:px-8 sm:py-10">
        {/* Hero */}
        <header>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-[family-name:var(--font-brand)] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {project.name}
            </h1>
            <StatusBadge
              label={projectStatusLabel(clientFacingStatus)}
              tone={projectStatusTone(clientFacingStatus)}
              icon={projectStatusIcon(clientFacingStatus)}
              className="sm:hidden"
            />
          </div>
          <p className="mt-3 text-base leading-relaxed text-muted">
            {project.greeting}
          </p>

          <div className="mt-8">
            <p className="font-[family-name:var(--font-brand)] text-3xl font-bold tabular-nums text-ink">
              {progress}%{" "}
              <span className="text-base font-medium text-muted">complete</span>
            </p>
            <ProgressBar value={progress} className="mt-3" />
            <p className="mt-3 text-sm text-muted">
              {total === 0
                ? "No project updates yet"
                : `${completed} of ${total} tasks completed`}
              {project.deadlineRelative ? (
                <>
                  <span className="mx-1.5 text-muted-soft" aria-hidden>
                    ·
                  </span>
                  {project.deadlineRelative}
                </>
              ) : null}
            </p>
          </div>
        </header>

        {/* What's happening */}
        <Section title="What's happening">
          {tasks.length === 0 ? (
            <Panel className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-ink">
                No project updates yet
              </p>
              <p className="mt-1.5 text-sm text-muted">
                The project owner will share progress here as work begins.
              </p>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <ol className="divide-y divide-border">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex gap-3 px-4 py-3.5 sm:px-5"
                  >
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                        task.status === "completed"
                          ? "bg-ink text-card"
                          : task.status === "in-progress"
                            ? "border-2 border-accent text-ink"
                            : "border border-border text-muted"
                      }`}
                      aria-hidden
                    >
                      {task.status === "completed" ? (
                        <Check className="size-3.5" strokeWidth={2.5} />
                      ) : (
                        <Circle
                          className="size-2 fill-current"
                          strokeWidth={0}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p
                          className={`text-sm font-medium ${
                            task.status === "upcoming"
                              ? "text-muted"
                              : "text-ink"
                          }`}
                        >
                          {task.name}
                        </p>
                        <span className="text-xs font-medium text-muted">
                          {task.status === "completed" && task.completedAt
                            ? `Completed ${task.completedAt}`
                            : taskStatusLabel(task.status)}
                        </span>
                      </div>
                      {task.description &&
                      task.status === "in-progress" ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {task.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </Section>

        {/* Next up */}
        <Section title="Next up">
          <Panel className="p-5">
            {allComplete ? (
              <>
                <h3 className="text-base font-semibold text-ink">
                  Everything is complete
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  All project tasks have been completed.
                </p>
              </>
            ) : currentTask || project.nextUp ? (
              <>
                <h3 className="text-base font-semibold text-ink">
                  {currentTask?.name ?? project.nextUp?.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {currentTask?.description ||
                    project.nextUp?.description ||
                    project.statusMessage}
                </p>
                <p className="mt-4 text-xs font-medium text-muted">
                  In progress
                </p>
                {project.nextUp?.expectedUpdate ? (
                  <p className="mt-2 text-xs text-muted">
                    Expected next update: {project.nextUp.expectedUpdate}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-ink">
                  No next step yet
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  We&apos;ll update this project when the next stage begins.
                </p>
              </>
            )}
          </Panel>
        </Section>

        {/* Project details */}
        <Section title="Project details">
          <Panel className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Deadline</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {project.deadlineLabel || project.deadline}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Project value</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {formatMoney(project.value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Status</p>
              <p className="mt-1">
                <StatusBadge
                  label={projectStatusLabel(clientFacingStatus)}
                  tone={projectStatusTone(clientFacingStatus)}
                  icon={projectStatusIcon(clientFacingStatus)}
                />
              </p>
            </div>
          </Panel>
        </Section>

        {/* Files */}
        <Section title="Files">
          {filesError ? (
            <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="text-sm text-muted">Couldn&apos;t load shared files.</p>
              <button
                type="button"
                onClick={() => {
                  setFilesError(false);
                  setFiles(portalFiles);
                }}
                className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </Panel>
          ) : files.length === 0 ? (
            <Panel className="px-5 py-8 text-center">
              <p className="text-sm font-medium text-ink">
                No files have been shared yet.
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Files shared with you will appear here.
              </p>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <ul className="divide-y divide-border">
                {files.map((file) => {
                  const Icon =
                    file.type === "ZIP" ? FileArchive : FileText;
                  return (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted">
                          {file.type} · {file.size}
                          {file.uploaded ? ` · ${file.uploaded}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label={`Download ${file.name}`}
                        disabled={downloadingId === file.id}
                        onClick={() => downloadFile(file.id, file.name)}
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                        {downloadingId === file.id ? "…" : "Download"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </Section>

        {/* Payment */}
        <Section title="Payment">
          {paymentError ? (
            <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <p className="text-sm text-muted">
                Payment information couldn&apos;t be loaded.
              </p>
              <button
                type="button"
                onClick={() => setPaymentError(false)}
                className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
              >
                Retry
              </button>
            </Panel>
          ) : !invoice && project.value <= 0 ? (
            <Panel className="px-5 py-8 text-center">
              <p className="text-sm text-muted">
                No payment information available yet.
              </p>
            </Panel>
          ) : project.remaining <= 0 || project.paymentState === "paid" ? (
            <Panel className="p-5">
              <StatusBadge
                label="Paid"
                tone="success"
                icon={paymentStatusIcon("paid")}
              />
              <p className="mt-3 text-sm text-muted">
                {formatMoney(project.value)} paid in full
              </p>
            </Panel>
          ) : (
            <Panel className="p-5">
              <p className="font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
                {formatMoney(project.paid)}{" "}
                <span className="font-medium text-muted">
                  / {formatMoney(project.value)} paid
                </span>
              </p>
              <ProgressBar value={paidPct} className="mt-3" />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Paid</p>
                  <p className="mt-0.5 font-medium text-ink">
                    {formatMoney(project.paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Remaining</p>
                  <p className="mt-0.5 font-medium text-ink">
                    {formatMoney(project.remaining)}
                  </p>
                </div>
              </div>

              {invoice ? (
                <div className="mt-5 rounded-[10px] bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {invoice.number}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {invoice.title}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Due {invoice.due}
                      </p>
                      <p className="mt-2">
                        <StatusBadge
                          label={paymentStatusLabel(invoice.status)}
                          tone={paymentStatusTone(invoice.status)}
                          icon={paymentStatusIcon(invoice.status)}
                        />
                      </p>
                      {invoice.status === "failed" ? (
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                          The payment could not be completed. Please try again
                          or contact the business.
                        </p>
                      ) : null}
                    </div>
                    {showPay ? (
                      <a
                        href={portalBusiness.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[8px] btn-accent px-4 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                      >
                        Pay {formatMoney(invoice.remaining)}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Panel>
          )}
        </Section>

        {/* Messages */}
        <Section id="messages" title="Messages">
          <div ref={messagesRef}>
            {messagesError ? (
              <Panel className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <p className="text-sm text-muted">Couldn&apos;t load messages.</p>
                <button
                  type="button"
                  onClick={() => {
                    setMessagesError(false);
                    setMessages(portalMessages);
                  }}
                  className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              </Panel>
            ) : (
              <Panel className="flex flex-col overflow-hidden">
                <div
                  ref={listRef}
                  className="max-h-[320px] min-h-[160px] space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full min-h-[140px] flex-col items-center justify-center px-4 text-center">
                      <p className="text-sm font-medium text-ink">
                        No messages yet
                      </p>
                      <p className="mt-1.5 text-sm text-muted">
                        Start a conversation about your project.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isClient = msg.author === "client";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isClient ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-ink">
                              {msg.name}
                            </span>
                            <span className="text-[11px] text-muted">
                              {msg.time}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-sm leading-relaxed ${
                              isClient
                                ? "bg-accent text-ink"
                                : "bg-surface text-ink"
                            }`}
                          >
                            {msg.body}
                          </div>
                          {msg.failed ? (
                            <div className="mt-1.5 flex items-center gap-2 text-xs">
                              <span className="text-danger">
                                Failed to send
                              </span>
                              <button
                                type="button"
                                onClick={() => retryMessage(msg.id)}
                                className="cursor-pointer font-semibold text-ink underline-offset-2 hover:underline"
                              >
                                Retry
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border p-3">
                  <label htmlFor="portal-message-input" className="sr-only">
                    Write a message
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      id="portal-message-input"
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Write a message..."
                      className="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-[8px] border border-border bg-background px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink focus-visible:ring-2 focus-visible:ring-ink/15"
                    />
                    <Button
                      variant="accent"
                      size="md"
                      disabled={!draft.trim()}
                      onClick={sendMessage}
                      aria-label="Send message"
                    >
                      <Send className="size-4" strokeWidth={1.75} />
                      Send
                    </Button>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </Section>

        {/* Need anything */}
        <Section title="Need anything?">
          <Panel className="p-5">
            <p className="text-sm leading-relaxed text-muted">
              Have a question about your project?
            </p>
            <Button
              variant="accent"
              size="md"
              className="mt-4"
              onClick={scrollToMessages}
            >
              Message {portalBusiness.ownerFirstName}
            </Button>
          </Panel>
        </Section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-6 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left">
          {portalBusiness.showPoweredBy ? (
            <p className="text-xs text-muted">Powered by Dueso</p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4 text-xs text-muted">
            <button
              type="button"
              className="cursor-pointer outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              Privacy
            </button>
            <a
              href={`mailto:${portalBusiness.contactEmail}`}
              className="outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientPortalPage({ slug }: ClientPortalPageProps) {
  return (
    <ToastProvider>
      <PortalContent slug={slug} />
    </ToastProvider>
  );
}
