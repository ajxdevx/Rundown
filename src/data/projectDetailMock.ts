export type ProjectStatus =
  | "active"
  | "draft"
  | "on-hold"
  | "completed"
  | "archived";

export type ProjectDetail = {
  id: string;
  slug: string;
  name: string;
  client: string;
  clientId: string;
  clientEmail: string;
  status: ProjectStatus;
  description: string;
  deadline: string;
  deadlineLabel: string;
  deadlineRelative: string;
  daysRemaining: number;
  overdue: boolean;
  value: number;
  currency: string;
  paid: number;
  remaining: number;
  paymentState: "paid" | "due" | "overdue" | "processing" | "failed";
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
  nextUp: {
    title: string;
    description: string;
  } | null;
  portalUrl: string;
  lastPortalView: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTaskStatus = "todo" | "in-progress" | "completed";

export type ProjectTask = {
  id: string;
  name: string;
  description?: string;
  done: boolean;
  visibleToClient: boolean;
  /** Task workflow status — defaults from `done` when omitted. */
  status?: ProjectTaskStatus;
  /** Display due label, e.g. "Sep 26" or "Tomorrow". */
  due?: string;
  updatedAt?: string;
};

export type ProjectFile = {
  id: string;
  name: string;
  type: "PDF" | "ZIP" | "IMG";
  size: string;
  uploaded: string;
  visibleToClient: boolean;
};

export type ProjectInvoice = {
  id: string;
  number: string;
  title: string;
  amount: number;
  due: string;
  paid: number;
  remaining: number;
  status: "paid" | "due" | "overdue" | "processing" | "failed" | "partial";
  hasPaymentLink: boolean;
};

export type ProjectMessage = {
  id: string;
  author: "client" | "freelancer";
  name: string;
  body: string;
  time: string;
};

export type ProjectActivity = {
  id: string;
  text: string;
  time: string;
  category: "portal" | "file" | "message" | "payment" | "task" | "project";
};

/** Blank project shell for initial React state — no demo seed project. */
export const emptyProjectDetail: ProjectDetail = {
  id: "",
  slug: "",
  name: "",
  client: "",
  clientId: "",
  clientEmail: "",
  status: "draft",
  description: "",
  deadline: "",
  deadlineLabel: "",
  deadlineRelative: "",
  daysRemaining: 0,
  overdue: false,
  value: 0,
  currency: "USD",
  paid: 0,
  remaining: 0,
  paymentState: "paid",
  progress: 0,
  tasksCompleted: 0,
  tasksTotal: 0,
  nextUp: null,
  portalUrl: "",
  lastPortalView: "Never",
  createdAt: "",
  updatedAt: "",
};

/** @deprecated Use emptyProjectDetail — kept for transitional imports */
export const projectDetail = emptyProjectDetail;

export const projectTasks: ProjectTask[] = [];
export const projectFiles: ProjectFile[] = [];
export const projectInvoices: ProjectInvoice[] = [];
export const projectMessages: ProjectMessage[] = [];
export const projectActivity: ProjectActivity[] = [];
