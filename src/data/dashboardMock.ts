/** Set to true to preview the brand-new account empty state. */
export const isNewAccount = false;

export type PaymentStatus =
  | "paid"
  | "due"
  | "partial"
  | "pending"
  | "overdue"
  | "processing"
  | "failed";

export type ProjectStatus =
  | "active"
  | "draft"
  | "on-hold"
  | "completed"
  | "archived"
  | "review";

export type ActiveProject = {
  id: string;
  slug: string;
  name: string;
  client: string;
  progress: number;
  currentTask: string;
  /** ISO date for sorting */
  deadlineAt: string;
  /** Display label e.g. "Due in 5 days" */
  deadlineLabel: string;
  value: number;
  paid: number;
  paymentStatus: PaymentStatus;
  status: ProjectStatus;
  updatedAt: string;
  createdAt: string;
};

export type RecentPayment = {
  id: string;
  invoice: string;
  client: string;
  project: string;
  amount: number;
  /** Display date e.g. "Sep 18" */
  date: string;
  /** Prefix for the date line: Due / Paid / Failed */
  dateLabel: "Due" | "Paid" | "Failed" | "Processing";
  status: "paid" | "due" | "overdue" | "processing" | "failed";
  href: string;
};

export type NeedsAttentionItem = {
  id: string;
  title: string;
  context: string;
  time: string;
  actionLabel: string;
  href: string;
  /** Visual weight — not a technical priority number */
  tone: "normal" | "attention" | "problem";
  kind: "message" | "approval" | "waiting" | "changes" | "followup";
};

export type DashboardActivityItem = {
  id: string;
  description: string;
  related: string;
  time: string;
  category: "portal" | "file" | "message" | "payment" | "task" | "project" | "client";
  href: string;
};

export type DashboardStats = {
  activeProjects: number;
  dueThisWeek: number;
  totalClients: number;
  activeClientsThisMonth: number;
  outstanding: number;
  outstandingInvoices: number;
  collected: number;
  collectedPeriod: string;
};

export const dashboardStats: DashboardStats = {
  activeProjects: 4,
  dueThisWeek: 2,
  totalClients: 12,
  activeClientsThisMonth: 3,
  outstanding: 2450,
  outstandingInvoices: 4,
  collected: 8720,
  collectedPeriod: "This month",
};

export const activeProjects: ActiveProject[] = [
  {
    id: "1",
    slug: "acme-website-redesign",
    name: "Website Redesign",
    client: "Acme Studio",
    progress: 72,
    currentTask: "Homepage development",
    deadlineAt: "2026-09-24",
    deadlineLabel: "Due in 5 days",
    value: 2400,
    paid: 1200,
    paymentStatus: "partial",
    status: "active",
    updatedAt: "2026-09-19T10:00:00Z",
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "2",
    slug: "acme-website-redesign",
    name: "Brand Identity",
    client: "Lumen Health",
    progress: 45,
    currentTask: "Logo refinements",
    deadlineAt: "2026-09-21",
    deadlineLabel: "Due in 2 days",
    value: 3200,
    paid: 1600,
    paymentStatus: "due",
    status: "active",
    updatedAt: "2026-09-18T14:00:00Z",
    createdAt: "2026-08-12T10:00:00Z",
  },
  {
    id: "3",
    slug: "acme-website-redesign",
    name: "Product UI",
    client: "Atlas CRM",
    progress: 91,
    currentTask: "Handoff documentation",
    deadlineAt: "2026-09-20",
    deadlineLabel: "Due tomorrow",
    value: 6500,
    paid: 6500,
    paymentStatus: "paid",
    status: "active",
    updatedAt: "2026-09-19T08:00:00Z",
    createdAt: "2026-07-20T10:00:00Z",
  },
  {
    id: "4",
    slug: "acme-website-redesign",
    name: "Pitch Deck",
    client: "Verde Capital",
    progress: 25,
    currentTask: "Slide structure review",
    deadlineAt: "2026-09-10",
    deadlineLabel: "Overdue by 9 days",
    value: 2200,
    paid: 0,
    paymentStatus: "overdue",
    status: "on-hold",
    updatedAt: "2026-09-05T10:00:00Z",
    createdAt: "2026-08-28T10:00:00Z",
  },
];

export const recentPayments: RecentPayment[] = [
  {
    id: "p1",
    invoice: "INV-004",
    client: "Acme Studio",
    project: "Website Redesign",
    amount: 750,
    date: "Sep 18",
    dateLabel: "Due",
    status: "due",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "p2",
    invoice: "INV-003",
    client: "Nova Labs",
    project: "Brand Identity",
    amount: 1200,
    date: "Sep 15",
    dateLabel: "Paid",
    status: "paid",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "p3",
    invoice: "INV-002",
    client: "Sarah Johnson",
    project: "Landing Page",
    amount: 500,
    date: "Sep 12",
    dateLabel: "Paid",
    status: "paid",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "p4",
    invoice: "INV-001",
    client: "Verde Capital",
    project: "Pitch Deck",
    amount: 1100,
    date: "Sep 5",
    dateLabel: "Due",
    status: "overdue",
    href: "/projects/acme-website-redesign",
  },
];

/** Action-required items only — not portal views or payment duplicates. */
export const needsAttention: NeedsAttentionItem[] = [
  {
    id: "n1",
    title: "Sarah sent you a message",
    context: "Website Redesign · Acme Studio",
    time: "12 min ago",
    actionLabel: "View Message",
    href: "/projects/acme-website-redesign",
    tone: "attention",
    kind: "message",
  },
  {
    id: "n2",
    title: "Client approval is needed",
    context: "Brand Identity · Acme Studio",
    time: "1 hour ago",
    actionLabel: "Open Project",
    href: "/projects/acme-website-redesign",
    tone: "attention",
    kind: "approval",
  },
  {
    id: "n3",
    title: "Waiting for client input",
    context: "Landing Page · Sarah Johnson",
    time: "Yesterday",
    actionLabel: "Open Project",
    href: "/projects/acme-website-redesign",
    tone: "normal",
    kind: "waiting",
  },
  {
    id: "n4",
    title: "Client requested changes",
    context: "Website Redesign · Acme Studio",
    time: "Yesterday",
    actionLabel: "View Request",
    href: "/projects/acme-website-redesign",
    tone: "attention",
    kind: "changes",
  },
];

/** @deprecated Prefer needsAttention — kept for any legacy imports */
export const clientFollowUps = needsAttention.map((item) => ({
  id: item.id,
  text: item.title,
  actionLabel: item.actionLabel,
  href: item.href,
  priority:
    item.tone === "attention" || item.tone === "problem"
      ? ("attention" as const)
      : ("normal" as const),
}));

export const dashboardActivity: DashboardActivityItem[] = [
  {
    id: "a1",
    description: "Sarah viewed Website Redesign",
    related: "Acme Studio · Portal",
    time: "12 min ago",
    category: "portal",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a2",
    description: "John downloaded Final Design.pdf",
    related: "Brand Identity · Nova Labs",
    time: "1 hour ago",
    category: "file",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a3",
    description: "Invoice INV-003 was paid",
    related: "Acme Studio · Website Redesign",
    time: "3 hours ago",
    category: "payment",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a4",
    description: 'You completed "Homepage Design"',
    related: "Website Redesign",
    time: "Yesterday",
    category: "task",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a5",
    description: "Sarah sent a message",
    related: "Website Redesign · Acme Studio",
    time: "Yesterday",
    category: "message",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a6",
    description: "Project created — Brand Identity",
    related: "Nova Labs",
    time: "3 days ago",
    category: "project",
    href: "/projects/acme-website-redesign",
  },
];
