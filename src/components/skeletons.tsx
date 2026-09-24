"use client";

import type { CSSProperties, ReactNode } from "react";
import { PROJECTS_FILTER_WIDTHS } from "@/lib/projectsView";

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
  children: ReactNode;
  className?: string;
  radiusClass?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <span
        className="invisible inline-flex items-center gap-1.5 whitespace-nowrap"
        aria-hidden
      >
        {children}
      </span>
      <span
        className={`auth-skeleton absolute inset-0 ${radiusClass}`}
        aria-hidden
      />
    </span>
  );
}

/** Matches MenuDropdown / MultiSelect trigger shell exactly. */
function GhostMenuButton({
  label,
  widthLabel,
}: {
  label: string;
  widthLabel: string;
}) {
  return (
    <div className="relative shrink-0">
      <span className="relative inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-sm font-medium">
        <span className="inline-grid text-left">
          <span
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
            aria-hidden
          >
            {widthLabel}
          </span>
          <span
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
            aria-hidden
          >
            {label}
          </span>
        </span>
        <span className="invisible size-3.5 shrink-0" aria-hidden />
        <span
          className="auth-skeleton absolute inset-0 rounded-[8px]"
          aria-hidden
        />
      </span>
    </div>
  );
}

/** Compact project card bone — mirrors ProjectCard compact layout. */
function ProjectCardSkeleton({
  name,
  client,
  meta,
  deadline,
  funds,
}: {
  name: string;
  client: string;
  meta: string;
  deadline: string;
  funds: string;
}) {
  return (
    <li className="card-surface flex flex-col p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">
            <GhostText>{name}</GhostText>
          </h3>
          <p className="mt-0.5 flex min-w-0 items-baseline gap-1.5 truncate text-xs">
            <span className="shrink-0 font-medium text-muted-soft">
              <GhostText>Client:</GhostText>
            </span>
            <span className="truncate text-muted">
              <GhostText>{client}</GhostText>
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <GhostControl
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
              radiusClass="rounded-md"
            >
              Active
            </GhostControl>
            <GhostControl
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
              radiusClass="rounded-md"
            >
              Unpaid
            </GhostControl>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Bone className="size-8 shrink-0 rounded-[8px]" />
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <span className="shrink-0 font-medium text-muted-soft">
              <GhostText>Due:</GhostText>
            </span>
            <GhostControl
              className="inline-flex h-6 items-center gap-1 px-2 text-[11px] font-semibold"
              radiusClass="rounded-md"
            >
              {deadline}
            </GhostControl>
          </span>
        </div>
      </div>

      <div className="mt-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-muted">
            <GhostText>{meta}</GhostText>
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <Bone className="h-full w-2/3 rounded-full" />
        </div>
      </div>

      <div className="mt-2.5 text-xs">
        <GhostText>{funds}</GhostText>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-soft">
          <GhostText>Client portal</GhostText>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <GhostControl className="inline-flex h-8 gap-1.5 px-3 text-xs font-medium">
            Copy link
          </GhostControl>
          <GhostControl className="inline-flex h-8 px-3.5 text-xs font-medium">
            Open
          </GhostControl>
        </div>
      </div>
    </li>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
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
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold">
            <span className="invisible inline-flex items-center gap-2 whitespace-nowrap">
              <span className="size-4 shrink-0" aria-hidden />
              New Project
            </span>
            <span
              className="auth-skeleton absolute inset-0 rounded-[8px]"
              aria-hidden
            />
          </span>
          <span className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold">
            <span className="invisible inline-flex items-center gap-2 whitespace-nowrap">
              <span className="size-4 shrink-0" aria-hidden />
              Add a client
            </span>
            <span
              className="auth-skeleton absolute inset-0 rounded-[8px]"
              aria-hidden
            />
          </span>
        </div>
      </div>

      {/* Summary — matches dashboardStats mock */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            {
              label: "Active Projects",
              value: "4",
              support: "0 due this week",
            },
            { label: "Total Clients", value: "3", support: "3 total" },
            {
              label: "Outstanding",
              value: "$4,350",
              support: "3 invoices",
            },
            {
              label: "Collected",
              value: "$2,200",
              support: "This month",
            },
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

      {/* Projects + Payments — same xl grid as live */}
      <div className="mb-8 flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] xl:grid-rows-[auto_1fr] xl:gap-x-6 xl:gap-y-4">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="section-title">
                <GhostText>Active Projects</GhostText>
              </h2>
              <span className="text-sm font-medium text-muted">
                <GhostText>View all</GhostText>
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              <GhostText>
                Your live work — progress, payments, and what&apos;s due
                next.
              </GhostText>
            </p>
          </div>
        </div>

        <div className="order-3 min-w-0 xl:order-none xl:col-start-2 xl:row-start-1">
          <div className="mb-4 xl:mb-0">
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
        </div>

        <div className="min-w-0 xl:col-start-1 xl:row-start-2">
          <ul className="grid h-full content-start gap-2.5">
            <ProjectCardSkeleton
              name="Website Redesign"
              client="Acme Studio"
              meta="72%"
              deadline="In 5 days"
              funds="$4,800 · $2,400 paid · $2,400 remaining"
            />
            <ProjectCardSkeleton
              name="Brand Identity"
              client="Lumen Health"
              meta="45%"
              deadline="In 2 days"
              funds="$3,200 · $3,200 paid · $0 remaining"
            />
          </ul>
        </div>

        <div className="order-4 flex min-h-0 min-w-0 flex-col xl:order-none xl:col-start-2 xl:row-start-2">
          <div className="card-surface flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  <GhostText>Outstanding</GhostText>
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                  <GhostText>$4,350</GhostText>
                </p>
                <p className="mt-1 text-xs text-muted-soft">
                  <GhostText>Across 3 invoices</GhostText>
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  <GhostText>Collected</GhostText>
                </p>
                <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
                  <GhostText>$2,200</GhostText>
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
                    title: "INV-014 — Website Redesign",
                    detail: "Acme Studio · $1,200",
                    date: "Due Sep 24",
                    badge: "Unpaid",
                  },
                  {
                    title: "INV-015 — Product UI",
                    detail: "Verde Capital · $2,100",
                    date: "Due Oct 1",
                    badge: "Unpaid",
                  },
                  {
                    title: "INV-016 — Launch Kit",
                    detail: "Verde Capital · $1,050",
                    date: "Due Sep 19",
                    badge: "Past due",
                  },
                  {
                    title: "INV-011 — Product UI",
                    detail: "Verde Capital · $2,200",
                    date: "Paid Sep 18",
                    badge: "Paid",
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
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                        radiusClass="rounded-md"
                      >
                        {row.badge}
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
      </div>

      {/* Recent Activity + Needs Attention */}
      <div className="mb-8 grid items-stretch gap-6 lg:grid-cols-2">
        <div className="flex min-h-0 min-w-0 flex-col">
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
          <div className="card-surface flex min-h-0 flex-1 flex-col overflow-hidden">
            <ul>
              {(
                [
                  {
                    title: "Sarah viewed Website Redesign",
                    related: "Client Portal",
                    time: "12 min ago",
                  },
                  {
                    title: "Sarah sent a message",
                    related: "Website Redesign",
                    time: "18 min ago",
                  },
                  {
                    title: "You completed Homepage Design",
                    related: "Website Redesign",
                    time: "45 min ago",
                  },
                  {
                    title: "Invoice INV-011 was paid",
                    related: "Product UI · Verde Capital",
                    time: "Yesterday",
                  },
                  {
                    title: "Maya left feedback on logo refinements",
                    related: "Brand Identity",
                    time: "Yesterday",
                  },
                  {
                    title: "Project created — Launch Kit",
                    related: "Verde Capital",
                    time: "3 days ago",
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.title}
                  className="border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
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

        <div className="flex min-h-0 min-w-0 flex-col">
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
          <div className="card-surface flex min-h-0 flex-1 flex-col overflow-hidden">
            <ul className="flex flex-1 flex-col">
              {(
                [
                  {
                    title: "Sarah is waiting on a reply",
                    context: "Website Redesign · Messages",
                    time: "18 min ago",
                    action: "Reply",
                  },
                  {
                    title: "Homepage design needs approval",
                    context: "Website Redesign · Tasks",
                    time: "45 min ago",
                    action: "Review",
                  },
                  {
                    title: "INV-016 is overdue",
                    context: "Verde Capital · Launch Kit · $1,050",
                    time: "2 hr ago",
                    action: "View invoice",
                  },
                  {
                    title: "Maya left feedback on logo refinements",
                    context: "Brand Identity · Files",
                    time: "Yesterday",
                    action: "Open",
                  },
                ] as const
              ).map((item) => (
                <li
                  key={item.title}
                  className="flex flex-1 border-b border-border last:border-0"
                >
                  <div className="flex w-full items-start gap-3 px-5 py-4">
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
      meta: "72%",
      deadline: "Today",
      funds: "$4,800 · $2,400 paid · $2,400 remaining",
    },
    {
      name: "Brand Identity",
      client: "Lumen Health",
      meta: "45%",
      deadline: "In 2 days",
      funds: "$3,200 · $3,200 paid · $0 remaining",
    },
    {
      name: "Product UI",
      client: "Verde Capital",
      meta: "91%",
      deadline: "Tomorrow",
      funds: "$6,500 · $4,400 paid · $2,100 remaining",
    },
    {
      name: "Launch Kit",
      client: "Verde Capital",
      meta: "30%",
      deadline: "3 days late",
      funds: "$2,100 · $0 paid · $2,100 remaining",
    },
    {
      name: "Newsletter Templates",
      client: "Acme Studio",
      meta: "10%",
      deadline: "No deadline",
      funds: "$900 · $0 paid · $900 remaining",
    },
    {
      name: "Pitch Deck",
      client: "Lumen Health",
      meta: "100%",
      deadline: "No deadline",
      funds: "$1,800 · $1,800 paid · $0 remaining",
    },
    {
      name: "Social Pack",
      client: "Verde Capital",
      meta: "100%",
      deadline: "No deadline",
      funds: "$750 · $750 paid · $0 remaining",
    },
    {
      name: "Case Study Site",
      client: "Acme Studio",
      meta: "58%",
      deadline: "In 9 days",
      funds: "$2,400 · $800 paid · $1,600 remaining",
    },
  ] as const;

  return (
    <ul className="grid gap-2.5 lg:grid-cols-2">
      {projects.map((project) => (
        <ProjectCardSkeleton key={project.name} {...project} />
      ))}
    </ul>
  );
}

/** Same column track as ProjectsPage LIST_COLS. */
const PROJECT_LIST_COLS =
  "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_9rem_6.5rem_6.5rem_4.75rem_4.75rem_5.25rem_4.5rem_14.5rem]";

export function ProjectListSkeleton() {
  const rows = [
    {
      name: "Website Redesign",
      client: "Acme Studio",
      deadline: "Today",
      status: "Active",
      payment: "Unpaid",
      value: "$4,800",
      paid: "$2,400",
      remaining: "$2,400",
      progress: "72%",
    },
    {
      name: "Brand Identity",
      client: "Lumen Health",
      deadline: "In 2 days",
      status: "Active",
      payment: "Paid",
      value: "$3,200",
      paid: "$3,200",
      remaining: "$0",
      progress: "45%",
    },
    {
      name: "Product UI",
      client: "Verde Capital",
      deadline: "Tomorrow",
      status: "Active",
      payment: "Partial",
      value: "$6,500",
      paid: "$4,400",
      remaining: "$2,100",
      progress: "91%",
    },
    {
      name: "Launch Kit",
      client: "Verde Capital",
      deadline: "3 days late",
      status: "Active",
      payment: "Overdue",
      value: "$2,100",
      paid: "$0",
      remaining: "$2,100",
      progress: "30%",
    },
    {
      name: "Newsletter Templates",
      client: "Acme Studio",
      deadline: "No deadline",
      status: "Draft",
      payment: "Unpaid",
      value: "$900",
      paid: "$0",
      remaining: "$900",
      progress: "10%",
    },
    {
      name: "Pitch Deck",
      client: "Lumen Health",
      deadline: "No deadline",
      status: "Completed",
      payment: "Paid",
      value: "$1,800",
      paid: "$1,800",
      remaining: "$0",
      progress: "100%",
    },
    {
      name: "Social Pack",
      client: "Verde Capital",
      deadline: "No deadline",
      status: "Archived",
      payment: "Paid",
      value: "$750",
      paid: "$750",
      remaining: "$0",
      progress: "100%",
    },
    {
      name: "Case Study Site",
      client: "Acme Studio",
      deadline: "In 9 days",
      status: "Active",
      payment: "Unpaid",
      value: "$2,400",
      paid: "$800",
      remaining: "$1,600",
      progress: "58%",
    },
    {
      name: "Onboarding Deck",
      client: "Lumen Health",
      deadline: "In 5 days",
      status: "Active",
      payment: "Paid",
      value: "$1,200",
      paid: "$1,200",
      remaining: "$0",
      progress: "64%",
    },
    {
      name: "Investor Update",
      client: "Verde Capital",
      deadline: "Tomorrow",
      status: "On Hold",
      payment: "Unpaid",
      value: "$1,500",
      paid: "$0",
      remaining: "$1,500",
      progress: "22%",
    },
    {
      name: "Help Center",
      client: "Acme Studio",
      deadline: "In 14 days",
      status: "Draft",
      payment: "Unpaid",
      value: "$3,600",
      paid: "$0",
      remaining: "$3,600",
      progress: "8%",
    },
    {
      name: "Q4 Campaign",
      client: "Lumen Health",
      deadline: "In 11 days",
      status: "Active",
      payment: "Partial",
      value: "$2,800",
      paid: "$1,000",
      remaining: "$1,800",
      progress: "41%",
    },
  ] as const;

  return (
    <div className="card-surface overflow-hidden">
      <div
        className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${PROJECT_LIST_COLS}`}
      >
        <span>
          <GhostText>Project</GhostText>
        </span>
        <span>
          <GhostText>Client</GhostText>
        </span>
        <span>
          <GhostText>Due</GhostText>
        </span>
        <span>
          <GhostText>Status</GhostText>
        </span>
        <span>
          <GhostText>Payment</GhostText>
        </span>
        <span>
          <GhostText>Value</GhostText>
        </span>
        <span>
          <GhostText>Paid</GhostText>
        </span>
        <span>
          <GhostText>Remaining</GhostText>
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
            className="border-b border-border last:border-0"
          >
            <div
              className={`grid items-center gap-3 px-5 py-4 lg:gap-4 ${PROJECT_LIST_COLS}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  <GhostText>{row.name}</GhostText>
                </p>
              </div>
              <p className="min-w-0 truncate text-sm text-muted">
                <GhostText>{row.client}</GhostText>
              </p>
              <GhostControl
                className="inline-flex w-fit max-w-full justify-self-start items-center truncate px-2 py-1 text-[11px] font-semibold"
                radiusClass="rounded-md"
              >
                {row.deadline}
              </GhostControl>
              <div className="min-w-0">
                <GhostControl
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                  radiusClass="rounded-md"
                >
                  {row.status}
                </GhostControl>
              </div>
              <div className="min-w-0">
                <GhostControl
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
                  radiusClass="rounded-md"
                >
                  {row.payment}
                </GhostControl>
              </div>
              <p className="min-w-0 truncate text-sm font-medium text-ink">
                <GhostText>{row.value}</GhostText>
              </p>
              <p className="min-w-0 truncate text-sm font-medium text-ink">
                <GhostText>{row.paid}</GhostText>
              </p>
              <p className="min-w-0 truncate text-sm font-medium text-ink">
                <GhostText>{row.remaining}</GhostText>
              </p>
              <div className="min-w-0">
                <div className="mb-1.5">
                  <p className="text-xs text-muted">
                    <GhostText>{row.progress}</GhostText>
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectsPageSkeleton({
  viewMode = "grid",
}: {
  viewMode?: "list" | "grid";
}) {
  return (
    <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* Header — matches live ProjectsPage */}
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
          <div className="inline-flex h-11 items-center gap-0.5 rounded-[8px] border border-border bg-card p-1">
            <GhostControl
              className="inline-flex h-9 items-center px-2.5 text-xs font-semibold"
              radiusClass="rounded-[6px]"
            >
              <span className="size-3.5 shrink-0" aria-hidden />
              List
            </GhostControl>
            <GhostControl
              className="inline-flex h-9 items-center px-2.5 text-xs font-semibold"
              radiusClass="rounded-[6px]"
            >
              <span className="size-3.5 shrink-0" aria-hidden />
              Grid
            </GhostControl>
          </div>
          <span className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold">
            <span className="invisible inline-flex items-center gap-2 whitespace-nowrap">
              <span className="size-4 shrink-0" aria-hidden />
              New Project
            </span>
            <span
              className="auth-skeleton absolute inset-0 rounded-[8px]"
              aria-hidden
            />
          </span>
        </div>
      </div>

      {/* Search + filters + sort — matches live ProjectsPage */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 lg:max-w-md">
          <span className="invisible size-4 shrink-0" aria-hidden />
          <span className="invisible min-w-0 flex-1 truncate text-sm whitespace-nowrap">
            Search projects...
          </span>
          <span
            className="auth-skeleton absolute inset-0 rounded-[10px]"
            aria-hidden
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Project status"
            className="flex flex-wrap gap-1.5"
          >
            {(
              [
                "All",
                "Active",
                "Draft",
                "On Hold",
                "Completed",
                "Archived",
              ] as const
            ).map((label) => (
              <GhostControl
                key={label}
                className="h-8 px-3 text-xs font-medium"
                radiusClass="rounded-[8px]"
              >
                {label}
              </GhostControl>
            ))}
          </div>
          <GhostMenuButton
            label="All payments"
            widthLabel={PROJECTS_FILTER_WIDTHS.payments}
          />
          <GhostMenuButton
            label="All clients"
            widthLabel={PROJECTS_FILTER_WIDTHS.clients}
          />
          <GhostMenuButton
            label="Sort: Recently updated"
            widthLabel={PROJECTS_FILTER_WIDTHS.sort}
          />
        </div>
      </div>

      {viewMode === "grid" ? <ProjectRowsSkeleton /> : <ProjectListSkeleton />}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <Bone className="h-8 w-56 rounded-[4px]" />
          <Bone className="mt-2 h-4 w-32 rounded-[4px]" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-11 w-32 rounded-[8px]" />
          <Bone className="h-11 w-36 rounded-[8px]" />
          <Bone className="h-11 w-11 rounded-[8px]" />
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-surface px-5 py-4">
            <Bone className="h-3 w-16 rounded-[4px]" />
            <Bone className="mt-2 h-7 w-24 rounded-[4px]" />
            <Bone className="mt-2 h-3 w-20 rounded-[4px]" />
          </div>
        ))}
      </div>
      <div className="mb-8 flex gap-1 border-b border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="mb-3 h-5 w-16 rounded-[4px]" />
        ))}
      </div>
      <div className="space-y-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)]">
          <Bone className="h-48 w-full rounded-[var(--radius-md)]" />
          <Bone className="h-48 w-full rounded-[var(--radius-md)]" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)]">
          <Bone className="h-40 w-full rounded-[var(--radius-md)]" />
          <Bone className="h-40 w-full rounded-[var(--radius-md)]" />
        </div>
        <Bone className="h-52 w-full rounded-[var(--radius-md)]" />
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
