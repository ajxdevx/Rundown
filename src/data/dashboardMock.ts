import {
  seedDashboardPayments,
  seedNeedsAttention,
} from "@/data/seedWorkspace";

/** True when the workspace has no projects yet (empty-state dashboard). */
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
  /** Display label e.g. "In 5 days" */
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
  category:
    | "portal"
    | "file"
    | "message"
    | "payment"
    | "task"
    | "project"
    | "client";
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
  activeProjects: 3,
  dueThisWeek: 3,
  totalClients: 3,
  activeClientsThisMonth: 3,
  outstanding: 4350,
  outstandingInvoices: 3,
  collected: 2200,
  collectedPeriod: "This month",
};

/** @deprecated Prefer live created projects. */
export const activeProjects: ActiveProject[] = [];

export const recentPayments: RecentPayment[] = seedDashboardPayments;

export const needsAttention: NeedsAttentionItem[] = seedNeedsAttention;

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

export const dashboardActivity: DashboardActivityItem[] = [];
