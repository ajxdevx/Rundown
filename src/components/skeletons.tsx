"use client";

import type { CSSProperties } from "react";

/** Skeleton fill — no default radius; pass the exact live radius. */
function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`auth-skeleton inline-block ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** Reserves exact text width/height from live copy, paints a thin skeleton over it. */
function GhostText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="invisible whitespace-pre" aria-hidden>
        {children}
      </span>
      <span
        className="auth-skeleton absolute inset-x-0 inset-y-[0.18em] rounded-[4px]"
        aria-hidden
      />
    </span>
  );
}

/** Reserves exact control size from live label. */
function GhostControl({
  children,
  className = "",
  radiusClass = "rounded-[8px]",
}: {
  children: string;
  className?: string;
  radiusClass?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <span className="invisible whitespace-nowrap" aria-hidden>
        {children}
      </span>
      <span
        className={`auth-skeleton absolute inset-0 ${radiusClass}`}
        aria-hidden
      />
    </span>
  );
}

const FILTER_LABELS = [
  "All",
  "Active",
  "Draft",
  "On Hold",
  "Completed",
  "Archived",
] as const;

export function DashboardSkeleton() {
  return (
    <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="page-title">
            <GhostText>Good evening, Alex</GhostText>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            <GhostText>
              Here&apos;s what&apos;s happening across your projects.
            </GhostText>
          </p>
        </div>
        <GhostControl className="inline-flex h-11 shrink-0 self-start px-4 text-sm font-semibold sm:self-auto">
          + New Project
        </GhostControl>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            { label: "Active Projects", value: "4", support: "2 due this week" },
            { label: "Total Clients", value: "12", support: "3 active this month" },
            { label: "Outstanding", value: "$2,450", support: "4 invoices" },
            { label: "Collected", value: "$8,720", support: "This month" },
          ] as const
        ).map((stat) => (
          <div key={stat.label} className="card-surface block px-5 py-4">
            <p className="text-xs font-medium text-muted">
              <GhostText>{stat.label}</GhostText>
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              <GhostText>{stat.value}</GhostText>
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              <GhostText>{stat.support}</GhostText>
            </p>
          </div>
        ))}
      </div>

      {/* Active Projects */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="section-title">
              <GhostText>Active Projects</GhostText>
            </h2>
            <span className="text-sm font-medium text-muted">
              <GhostText>View all</GhostText>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_LABELS.map((label) => (
                <GhostControl
                  key={label}
                  className="h-8 px-3 text-xs font-medium"
                >
                  {label}
                </GhostControl>
              ))}
            </div>
            <GhostControl className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium">
              Sort: Recently updated
            </GhostControl>
          </div>
        </div>

        <ul className="grid gap-3 lg:grid-cols-2">
          {(
            [
              {
                name: "Website Redesign",
                client: "Acme Studio",
                meta: "72% · Homepage development",
                deadline: "Due in 5 days",
                value: "$2,400",
                paid: "$1,200 paid",
              },
              {
                name: "Brand Identity",
                client: "Lumen Health",
                meta: "45% · Logo refinements",
                deadline: "Due in 2 days",
                value: "$3,200",
                paid: "$1,600 paid",
              },
              {
                name: "Product UI",
                client: "Atlas CRM",
                meta: "91% · Handoff documentation",
                deadline: "Due tomorrow",
                value: "$6,500",
                paid: "$6,500 paid",
              },
            ] as const
          ).map((project) => (
            <li
              key={project.name}
              className="card-surface flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">
                      <GhostText>{project.name}</GhostText>
                    </h3>
                    <GhostControl
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                      radiusClass="rounded-md"
                    >
                      Active
                    </GhostControl>
                    <GhostControl
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                      radiusClass="rounded-md"
                    >
                      Due
                    </GhostControl>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    <GhostText>{project.client}</GhostText>
                  </p>
                </div>
                <Bone className="size-8 shrink-0 rounded-[8px]" />
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span />
                  <p className="text-sm text-muted">
                    <GhostText>{project.meta}</GhostText>
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <Bone className="h-full w-2/3 rounded-full" />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <GhostText>{project.deadline}</GhostText>
                <span className="text-ink">
                  <GhostText>{project.value}</GhostText>
                </span>
                <GhostText>{project.paid}</GhostText>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                <GhostControl className="inline-flex h-9 gap-1.5 px-3 text-sm font-medium">
                  Copy link
                </GhostControl>
                <GhostControl className="inline-flex h-9 px-3.5 text-sm font-medium">
                  Open
                </GhostControl>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Payments + Needs Attention */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <h2 className="section-title">
                <GhostText>Payments</GhostText>
              </h2>
              <span className="text-sm font-medium text-muted">
                <GhostText>View all</GhostText>
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              <GhostText>
                Keep track of what&apos;s due and what you&apos;ve collected.
              </GhostText>
            </p>
          </div>
          <div className="card-surface overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  <GhostText>Outstanding</GhostText>
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                  <GhostText>$2,450</GhostText>
                </p>
                <p className="mt-1 text-xs text-muted-soft">
                  <GhostText>Across 4 invoices</GhostText>
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  <GhostText>Collected</GhostText>
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                  <GhostText>$8,720</GhostText>
                </p>
                <p className="mt-1 text-xs text-muted-soft">
                  <GhostText>This month</GhostText>
                </p>
              </div>
            </div>
            <ul>
              {(
                [
                  {
                    title: "INV-004 — Website Redesign",
                    detail: "Acme Studio · $750",
                    date: "Due Sep 18",
                  },
                  {
                    title: "INV-003 — Brand Identity",
                    detail: "Nova Labs · $1,200",
                    date: "Paid Sep 15",
                  },
                  {
                    title: "INV-002 — Landing Page",
                    detail: "Sarah Johnson · $500",
                    date: "Paid Sep 12",
                  },
                  {
                    title: "INV-001 — Pitch Deck",
                    detail: "Verde Capital · $1,100",
                    date: "Due Sep 5",
                  },
                ] as const
              ).map((row) => (
                <li
                  key={row.title}
                  className="flex items-start gap-3 border-b border-border px-5 py-4 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">
                        <GhostText>{row.title}</GhostText>
                      </p>
                      <GhostControl
                        className="px-2 py-0.5 text-xs font-medium"
                        radiusClass="rounded-md"
                      >
                        Due
                      </GhostControl>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      <GhostText>{row.detail}</GhostText>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-soft">
                      <GhostText>{row.date}</GhostText>
                    </p>
                  </div>
                  <Bone className="size-8 shrink-0 rounded-[8px]" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <h2 className="section-title">
                <GhostText>Needs Attention</GhostText>
              </h2>
              <span className="text-sm font-medium text-muted">
                <GhostText>4 items</GhostText>
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              <GhostText>A few things may need your attention.</GhostText>
            </p>
          </div>
          <div className="card-surface overflow-hidden">
            <ul>
              {(
                [
                  {
                    title: "Sarah sent you a message",
                    context: "Website Redesign · Acme Studio",
                    time: "12 min ago",
                    action: "View Message",
                  },
                  {
                    title: "Client approval is needed",
                    context: "Brand Identity · Acme Studio",
                    time: "1 hour ago",
                    action: "Open Project",
                  },
                  {
                    title: "Waiting for client input",
                    context: "Landing Page · Sarah Johnson",
                    time: "Yesterday",
                    action: "Open Project",
                  },
                  {
                    title: "Client requested changes",
                    context: "Website Redesign · Acme Studio",
                    time: "Yesterday",
                    action: "View Request",
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.title}
                  className="border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-3 px-5 py-4">
                    <Bone className="mt-0.5 size-8 shrink-0 rounded-[8px]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">
                        <GhostText>{item.title}</GhostText>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        <GhostText>{item.context}</GhostText>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-soft">
                        <GhostText>{item.time}</GhostText>
                      </p>
                    </div>
                    <span className="shrink-0 pt-0.5 text-sm font-medium text-muted">
                      <GhostText>{item.action}</GhostText>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <h2 className="section-title">
              <GhostText>Recent Activity</GhostText>
            </h2>
            <span className="text-sm font-medium text-muted">
              <GhostText>View all</GhostText>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            <GhostText>
              See what&apos;s been happening across your workspace.
            </GhostText>
          </p>
        </div>
        <div className="card-surface overflow-hidden">
          <ul>
            {(
              [
                {
                  title: "Sarah viewed Website Redesign",
                  related: "Acme Studio · Portal",
                  time: "12 min ago",
                },
                {
                  title: "John downloaded Final Design.pdf",
                  related: "Brand Identity · Nova Labs",
                  time: "1 hour ago",
                },
                {
                  title: "Invoice INV-003 was paid",
                  related: "Acme Studio · Website Redesign",
                  time: "3 hours ago",
                },
                {
                  title: 'You completed "Homepage Design"',
                  related: "Website Redesign",
                  time: "Yesterday",
                },
                {
                  title: "Sarah sent a message",
                  related: "Website Redesign · Acme Studio",
                  time: "Yesterday",
                },
                {
                  title: "Project created — Brand Identity",
                  related: "Nova Labs",
                  time: "3 days ago",
                },
              ] as const
            ).map((item) => (
              <li
                key={item.title}
                className="border-b border-border last:border-0"
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <Bone className="mt-0.5 size-8 shrink-0 rounded-[8px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      <GhostText>{item.title}</GhostText>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      <GhostText>{item.related}</GhostText>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-soft">
                    <GhostText>{item.time}</GhostText>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-2">
        <div className="mb-4">
          <h2 className="section-title">
            <GhostText>Quick Actions</GhostText>
          </h2>
          <p className="mt-1 text-sm text-muted">
            <GhostText>
              Get things done without leaving your Dashboard.
            </GhostText>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              {
                title: "New Project",
                description: "Set up a project and invite your client.",
              },
              {
                title: "Add Client",
                description: "Add a client to your workspace.",
              },
              {
                title: "Create Invoice",
                description: "Create and share a project invoice.",
              },
            ] as const
          ).map((action) => (
            <div
              key={action.title}
              className="flex items-center gap-3 rounded-[8px] border border-border bg-card px-4 py-3.5"
            >
              <Bone className="size-8 shrink-0 rounded-[8px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  <GhostText>{action.title}</GhostText>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted">
                  <GhostText>{action.description}</GhostText>
                </span>
              </span>
              <Bone className="size-5 shrink-0 rounded-[4px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectRowsSkeleton() {
  const projects = [
    {
      name: "Website Redesign",
      client: "Acme Studio",
      meta: "72% · Homepage development",
      deadline: "Due in 5 days",
      value: "$2,400",
      paid: "$1,200 paid",
    },
    {
      name: "Brand Identity",
      client: "Lumen Health",
      meta: "45% · Logo refinements",
      deadline: "Due in 2 days",
      value: "$3,200",
      paid: "$1,600 paid",
    },
    {
      name: "Product UI",
      client: "Atlas CRM",
      meta: "91% · Handoff documentation",
      deadline: "Due tomorrow",
      value: "$6,500",
      paid: "$6,500 paid",
    },
    {
      name: "Marketing Site",
      client: "Northwind Co",
      meta: "30% · Content drafting",
      deadline: "Due in 12 days",
      value: "$1,800",
      paid: "$900 paid",
    },
  ] as const;

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {projects.map((project) => (
        <li key={project.name} className="card-surface flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-semibold text-ink">
                  <GhostText>{project.name}</GhostText>
                </h3>
                <GhostControl
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                  radiusClass="rounded-md"
                >
                  Active
                </GhostControl>
                <GhostControl
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                  radiusClass="rounded-md"
                >
                  Due
                </GhostControl>
              </div>
              <p className="mt-1 text-sm text-muted">
                <GhostText>{project.client}</GhostText>
              </p>
            </div>
            <Bone className="size-8 shrink-0 rounded-[8px]" />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span />
              <p className="text-sm text-muted">
                <GhostText>{project.meta}</GhostText>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <Bone className="h-full w-2/3 rounded-full" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
            <GhostText>{project.deadline}</GhostText>
            <span className="text-ink">
              <GhostText>{project.value}</GhostText>
            </span>
            <GhostText>{project.paid}</GhostText>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
            <GhostControl className="inline-flex h-9 gap-1.5 px-3 text-sm font-medium">
              Copy link
            </GhostControl>
            <GhostControl className="inline-flex h-9 px-3.5 text-sm font-medium">
              Open
            </GhostControl>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProjectListSkeleton() {
  const cols =
    "lg:grid-cols-[minmax(0,1.5fr)_9rem_5.5rem_7.5rem_7.5rem_minmax(5rem,1fr)_14.5rem]";

  const rows = [
    {
      name: "Website Redesign",
      client: "Acme Studio",
      deadline: "Due in 5 days",
      value: "$2,400",
      payment: "Due",
      status: "Active",
      progress: "72%",
    },
    {
      name: "Brand Identity",
      client: "Lumen Health",
      deadline: "Due in 2 days",
      value: "$3,200",
      payment: "Paid",
      status: "Active",
      progress: "45%",
    },
    {
      name: "Product UI",
      client: "Atlas CRM",
      deadline: "Due tomorrow",
      value: "$6,500",
      payment: "Overdue",
      status: "On Hold",
      progress: "91%",
    },
    {
      name: "Marketing Site",
      client: "Northwind Co",
      deadline: "Due in 12 days",
      value: "$1,800",
      payment: "Processing",
      status: "Draft",
      progress: "30%",
    },
    {
      name: "App Redesign",
      client: "Orbit Labs",
      deadline: "Due in 8 days",
      value: "$4,100",
      payment: "Due",
      status: "Active",
      progress: "58%",
    },
    {
      name: "Launch Kit",
      client: "Harbor Co",
      deadline: "Due in 3 days",
      value: "$2,950",
      payment: "Paid",
      status: "Completed",
      progress: "100%",
    },
  ] as const;

  return (
    <div className="card-surface overflow-hidden">
      <div
        className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${cols}`}
      >
        <span>
          <GhostText>Project</GhostText>
        </span>
        <span>
          <GhostText>Deadline</GhostText>
        </span>
        <span>
          <GhostText>Value</GhostText>
        </span>
        <span>
          <GhostText>Payment</GhostText>
        </span>
        <span>
          <GhostText>Status</GhostText>
        </span>
        <span>
          <GhostText>Progress</GhostText>
        </span>
        <span className="sr-only">Actions</span>
      </div>
      <ul>
        {rows.map((row) => (
          <li
            key={row.name}
            className={`grid items-center gap-3 border-b border-border px-5 py-4 last:border-0 lg:gap-4 ${cols}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                <GhostText>{row.name}</GhostText>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                <GhostText>{row.client}</GhostText>
              </p>
            </div>
            <p className="min-w-0 truncate text-xs text-muted">
              <GhostText>{row.deadline}</GhostText>
            </p>
            <p className="min-w-0 truncate text-sm font-medium text-ink">
              <GhostText>{row.value}</GhostText>
            </p>
            <div className="min-w-0">
              <GhostControl
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                radiusClass="rounded-md"
              >
                {row.payment}
              </GhostControl>
            </div>
            <div className="min-w-0">
              <GhostControl
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
                radiusClass="rounded-md"
              >
                {row.status}
              </GhostControl>
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span />
                <p className="text-sm text-muted">
                  <GhostText>{row.progress}</GhostText>
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <Bone className="h-full w-2/3 rounded-full" />
              </div>
            </div>
            <div className="relative flex w-full flex-nowrap items-center justify-end gap-2">
              <GhostControl className="inline-flex h-9 shrink-0 gap-1.5 px-3 text-sm font-medium">
                Copy link
              </GhostControl>
              <GhostControl className="inline-flex h-9 shrink-0 px-3.5 text-sm font-medium">
                Open
              </GhostControl>
              <Bone className="size-8 shrink-0 rounded-[8px]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectsPageSkeleton({
  viewMode = "list",
}: {
  viewMode?: "list" | "grid";
}) {
  return (
    <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="page-title">
            <GhostText>Projects</GhostText>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            <GhostText>
              Manage your projects and keep everything moving.
            </GhostText>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex h-11 items-center rounded-[8px] border border-border bg-card p-1">
            <GhostControl className="inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-semibold">
              List
            </GhostControl>
            <GhostControl className="inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-semibold">
              Rows
            </GhostControl>
          </div>
          <GhostControl className="inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold">
            New Project
          </GhostControl>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Bone className="h-10 w-full rounded-[8px] lg:max-w-md" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Active", "Draft", "On Hold", "Completed", "Archived"] as const).map(
              (label) => (
                <GhostControl
                  key={label}
                  className="h-8 px-3 text-xs font-medium"
                >
                  {label}
                </GhostControl>
              ),
            )}
          </div>
          <GhostControl className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium">
            All payments
          </GhostControl>
          <GhostControl className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium">
            All clients
          </GhostControl>
          <GhostControl className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium">
            Sort: Recently updated
          </GhostControl>
        </div>
      </div>

      {viewMode === "grid" ? <ProjectRowsSkeleton /> : <ProjectListSkeleton />}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="w-full flex-1 px-6 py-6 sm:px-8">
      <Bone className="h-4 w-24 rounded-[4px]" />
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div>
          <Bone className="h-8 w-64 rounded-[4px]" />
          <Bone className="mt-3 h-4 w-40 rounded-[4px]" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-10 w-28 rounded-[8px]" />
          <Bone className="h-10 w-10 rounded-[8px]" />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-9 w-20 rounded-[8px]" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Bone className="h-3 w-28 rounded-[4px]" />
          <Bone className="mt-4 h-12 w-24 rounded-[4px]" />
          <Bone className="mt-5 h-2.5 w-full rounded-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Bone className="h-36 w-full rounded-2xl" />
          <Bone className="h-36 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ClientListSkeleton() {
  const cols =
    "lg:grid-cols-[minmax(0,1.5fr)_8.5rem_8rem_7rem_7.5rem_5.5rem_2.5rem]";
  const rows = [
    {
      name: "Sarah Johnson",
      meta: "Acme Studio · sarah@example.com",
      active: "2",
      total: "4",
      value: "$7,300",
      activity: "2 days ago",
      status: "Active",
    },
    {
      name: "Maya Chen",
      meta: "Lumen Health · maya@lumen.health",
      active: "1",
      total: "1",
      value: "$9,200",
      activity: "Yesterday",
      status: "Active",
    },
    {
      name: "John Smith",
      meta: "john@example.com",
      active: "1",
      total: "1",
      value: "$1,500",
      activity: "5 days ago",
      status: "Active",
    },
    {
      name: "Tom Rivera",
      meta: "Verde Capital · tom@verde.capital",
      active: "0",
      total: "1",
      value: "$2,200",
      activity: "12 days ago",
      status: "Inactive",
    },
  ] as const;

  return (
    <div className="card-surface overflow-hidden">
      <div
        className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${cols}`}
      >
        {(
          ["Client", "Active projects", "Total projects", "Total value", "Last activity", "Status"] as const
        ).map((label) => (
          <span key={label}>
            <GhostText>{label}</GhostText>
          </span>
        ))}
        <span className="sr-only">Actions</span>
      </div>
      <ul>
        {rows.map((row) => (
          <li
            key={row.name}
            className={`grid items-center gap-3 border-b border-border px-5 py-4 last:border-0 lg:gap-4 ${cols}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                <GhostText>{row.name}</GhostText>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                <GhostText>{row.meta}</GhostText>
              </p>
            </div>
            <p className="text-sm text-ink">
              <GhostText>{row.active}</GhostText>
            </p>
            <p className="text-sm text-ink">
              <GhostText>{row.total}</GhostText>
            </p>
            <p className="text-sm font-medium text-ink">
              <GhostText>{row.value}</GhostText>
            </p>
            <p className="truncate text-xs text-muted">
              <GhostText>{row.activity}</GhostText>
            </p>
            <GhostControl
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
              radiusClass="rounded-md"
            >
              {row.status}
            </GhostControl>
            <Bone className="size-8 justify-self-end rounded-[8px]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClientsPageSkeleton() {
  return (
    <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="page-title">
            <GhostText>Clients</GhostText>
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            <GhostText>Manage your clients and their projects.</GhostText>
          </p>
        </div>
        <GhostControl className="inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold">
          Add Client
        </GhostControl>
      </div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Bone className="h-10 w-full rounded-[8px] lg:max-w-md" />
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Active", "Inactive"] as const).map((label) => (
            <GhostControl key={label} className="h-8 px-3 text-xs font-medium">
              {label}
            </GhostControl>
          ))}
          <GhostControl className="inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium">
            Sort: Recently active
          </GhostControl>
        </div>
      </div>
      <ClientListSkeleton />
    </div>
  );
}

export function ClientDetailSkeleton() {
  return (
    <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8">
      <GhostText>Clients</GhostText>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="page-title">
              <GhostText>Sarah Johnson</GhostText>
            </h1>
            <GhostControl
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium"
              radiusClass="rounded-md"
            >
              Active
            </GhostControl>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            <GhostText>Acme Studio</GhostText>
          </p>
        </div>
        <div className="flex gap-2">
          <GhostControl className="inline-flex h-10 items-center gap-2 px-4 text-sm font-medium">
            Edit Client
          </GhostControl>
          <Bone className="size-10 rounded-[8px]" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
        {(
          [
            ["Active Projects", "2"],
            ["Total Projects", "4"],
            ["Total Value", "$7,300"],
            ["Outstanding", "$1,250"],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted">
              <GhostText>{label}</GhostText>
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink">
              <GhostText>{value}</GhostText>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h3 className="section-title">
            <GhostText>Client Information</GhostText>
          </h3>
          <div className="card-surface mt-4 space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Bone className="h-3 w-16 rounded-[4px]" />
                <Bone className="mt-2 h-4 w-40 rounded-[4px]" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8 lg:col-span-8">
          <div>
            <h3 className="section-title">
              <GhostText>Projects</GhostText>
            </h3>
            <div className="card-surface mt-4 space-y-0 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <Bone className="h-4 w-40 rounded-[4px]" />
                    <Bone className="mt-2 h-2 w-full max-w-xs rounded-full" />
                  </div>
                  <Bone className="h-9 w-16 rounded-[8px]" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="section-title">
              <GhostText>Activity</GhostText>
            </h3>
            <div className="card-surface mt-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 last:border-0"
                >
                  <Bone className="h-4 w-56 rounded-[4px]" />
                  <Bone className="h-3 w-16 rounded-[4px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortalSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Bone className="h-8 w-56 rounded-[4px]" />
      <Bone className="mt-3 h-4 w-72 rounded-[4px]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Bone className="h-4 w-40 rounded-[4px]" />
            <Bone className="mt-3 h-3 w-full rounded-[4px]" />
            <Bone className="mt-2 h-3 w-2/3 rounded-[4px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="w-full flex-1 px-6 py-6 sm:px-8">
      <Bone className="h-8 w-40 rounded-[4px]" />
      <Bone className="mt-3 h-4 w-64 rounded-[4px]" />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Bone className="h-48 w-full rounded-2xl" />
        <Bone className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:px-8 md:py-8">
      <div className="w-full shrink-0 md:w-56">
        <Bone className="h-8 w-32 rounded-[4px]" />
        <Bone className="mt-2 h-4 w-48 rounded-[4px]" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-9 w-full rounded-[8px]" />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <Bone className="h-7 w-40 rounded-[4px]" />
        <Bone className="h-4 w-64 max-w-full rounded-[4px]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Bone key={i} className="h-28 w-full rounded-[12px]" />
        ))}
      </div>
    </div>
  );
}

export function CreateProjectSkeleton() {
  return (
    <div className="w-full flex-1 px-6 py-6 sm:px-8">
      <Bone className="h-8 w-48 rounded-[4px]" />
      <Bone className="mt-3 h-4 w-72 rounded-[4px]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <Bone className="h-4 w-32 rounded-[4px]" />
            <Bone className="mt-4 h-11 w-full rounded-[8px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Bone className="h-9 w-14 rounded-[8px]" />
        <Bone className="h-9 w-16 rounded-[8px]" />
        <Bone className="h-9 w-14 rounded-[8px]" />
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
          >
            <Bone className="mt-0.5 size-9 shrink-0 rounded-[8px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-[70%] rounded-[4px]" />
              <Bone className="h-3 w-[40%] rounded-[4px]" />
              <Bone className="h-3 w-16 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ActivitySkeleton() {
  return (
    <>
      <div className="mb-4 max-w-md">
        <Bone className="h-10 w-full rounded-[8px]" />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-9 w-16 rounded-[8px]" />
        ))}
      </div>
      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:px-5"
          >
            <Bone className="mt-0.5 size-9 shrink-0 rounded-[8px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-[65%] rounded-[4px]" />
              <Bone className="h-3 w-[40%] rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
