import type { ProjectDetail } from "./projectDetailMock";

export type PortalTaskStatus = "completed" | "in-progress" | "upcoming";

export type PortalTask = {
  id: string;
  name: string;
  status: PortalTaskStatus;
  description?: string;
  completedAt?: string;
};

export type PortalAccess = "ok" | "not-found" | "disabled";

export const portalBusiness = {
  name: "Alex Design Studio",
  logoSrc: "/logo.png",
  contactEmail: "hello@alexdesign.studio",
  ownerFirstName: "Alex",
  ownerFullName: "Alex Johnson",
  paymentUrl: "https://pay.example.com/inv-002",
  /** When false, hide “Powered by Dueso” (Pro branding removal). */
  showPoweredBy: true,
};

/** Demo: set to "disabled" to preview revoked portal. */
export const portalAccessOverride: PortalAccess | null = null;

export const portalClient = {
  firstName: "there",
  fullName: "",
};

/** Blank portal shell — real portals load from created projects only. */
export const portalProject: ProjectDetail & {
  greeting: string;
  statusMessage: string;
  nextUp: {
    title: string;
    description: string;
    expectedUpdate: string;
  };
} = {
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
  portalUrl: "",
  lastPortalView: "Never",
  createdAt: "",
  updatedAt: "",
  greeting: "Here's the latest progress on your project.",
  statusMessage: "We'll share updates here as work progresses.",
  nextUp: {
    title: "No next step yet",
    description: "We'll update this project when the next stage begins.",
    expectedUpdate: "",
  },
};

export const portalTasks: PortalTask[] = [];

export function portalProgressFromTasks(tasks: PortalTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { progress, completed, total };
}

export const portalFiles: {
  id: string;
  name: string;
  type: "PDF" | "ZIP" | "IMG";
  size: string;
  uploaded: string;
  visibleToClient: boolean;
}[] = [];

export type PortalInvoice = {
  id: string;
  number: string;
  title: string;
  amount: number;
  due: string;
  paid: number;
  remaining: number;
  status: "paid" | "due" | "overdue" | "processing" | "failed" | "partial";
  hasPaymentLink: boolean;
} | null;

/** Outstanding invoice for pay CTA — never expose paid-as-unpaid. */
export const portalInvoice: PortalInvoice = null;

export type PortalMessage = {
  id: string;
  author: "client" | "freelancer";
  name: string;
  body: string;
  time: string;
  failed?: boolean;
};

export const portalMessages: PortalMessage[] = [];

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "due":
      return "Due";
    case "overdue":
      return "Overdue";
    case "processing":
      return "Processing";
    case "failed":
      return "Payment failed";
    case "partial":
      return "Due";
    default:
      return status;
  }
}

export function projectStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "on-hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}
