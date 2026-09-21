/**
 * Isolated fictional workspace for the landing-page interactive demo.
 * Never connected to Supabase, auth, Stripe, or production data.
 */

export type DemoTaskStatus = "completed" | "in-progress" | "upcoming";
export type DemoProjectStatus = "active" | "review" | "completed" | "on-hold";
export type DemoPaymentStatus = "paid" | "due" | "partial" | "overdue";
export type DemoView =
  | "dashboard"
  | "projects"
  | "clients"
  | "project"
  | "portal";
export type DemoProjectTab =
  | "overview"
  | "tasks"
  | "files"
  | "invoices"
  | "messages";

export type DemoClient = {
  id: string;
  name: string;
  contactName: string;
  contactFirstName: string;
  email: string;
  projectsCount: number;
};

export type DemoTask = {
  id: string;
  projectId: string;
  name: string;
  status: DemoTaskStatus;
  /** Internal-only tasks stay hidden in the portal */
  clientVisible: boolean;
  /** Client-facing action available in the portal */
  clientAction?: "review" | "feedback" | "approve" | null;
  clientActionLabel?: string;
  clientActionHint?: string;
};

export type DemoFile = {
  id: string;
  projectId: string;
  name: string;
  meta: string;
  clientVisible: boolean;
};

export type DemoInvoice = {
  id: string;
  projectId: string;
  number: string;
  amount: number;
  status: DemoPaymentStatus;
  dateLabel: string;
};

export type DemoMessage = {
  id: string;
  projectId: string;
  author: "business" | "client";
  authorName: string;
  body: string;
  time: string;
  /** Internal-only messages never appear in the portal */
  clientVisible: boolean;
};

export type DemoPortalSection =
  | "overview"
  | "tasks"
  | "files"
  | "payment"
  | "messages";

export type DemoActivity = {
  id: string;
  description: string;
  time: string;
  category: "task" | "payment" | "portal" | "project" | "message" | "file";
};

export type DemoNotification = {
  id: string;
  title: string;
  context: string;
  time: string;
  read: boolean;
};

export type DemoProject = {
  id: string;
  slug: string;
  name: string;
  clientId: string;
  clientName: string;
  status: DemoProjectStatus;
  progress: number;
  currentTask: string;
  deadlineLabel: string;
  value: number;
  paid: number;
  currency: string;
  description: string;
};

export const DEMO_WORKSPACE = {
  name: "Northline Studio",
  ownerName: "Alex Rivera",
  ownerFirstName: "Alex",
  currency: "GBP",
} as const;

export const INITIAL_DEMO_CLIENTS: DemoClient[] = [
  {
    id: "c-sarah",
    name: "Northline Coffee",
    contactName: "Sarah Mitchell",
    contactFirstName: "Sarah",
    email: "sarah@northlinecoffee.demo",
    projectsCount: 1,
  },
  {
    id: "c-daniel",
    name: "Arc Studio",
    contactName: "Daniel Reed",
    contactFirstName: "Daniel",
    email: "daniel@arcstudio.demo",
    projectsCount: 1,
  },
  {
    id: "c-emma",
    name: "Atelier Home",
    contactName: "Emma Wilson",
    contactFirstName: "Emma",
    email: "emma@atelierhome.demo",
    projectsCount: 2,
  },
];

export const INITIAL_DEMO_PROJECTS: DemoProject[] = [
  {
    id: "p-website",
    slug: "website-redesign",
    name: "Website Redesign",
    clientId: "c-sarah",
    clientName: "Northline Coffee",
    status: "active",
    progress: 50,
    currentTask: "Mobile Layout",
    deadlineLabel: "In 5 days",
    value: 4200,
    paid: 2100,
    currency: "GBP",
    description:
      "Full website redesign for Northline Coffee — homepage through checkout.",
  },
  {
    id: "p-brand",
    slug: "brand-identity",
    name: "Brand Identity",
    clientId: "c-daniel",
    clientName: "Arc Studio",
    status: "review",
    progress: 80,
    currentTask: "Client Review",
    deadlineLabel: "In 2 days",
    value: 2800,
    paid: 2800,
    currency: "GBP",
    description: "Logo system, typography, and brand guidelines for Arc Studio.",
  },
  {
    id: "p-launch",
    slug: "product-launch",
    name: "Product Launch",
    clientId: "c-emma",
    clientName: "Atelier Home",
    status: "active",
    progress: 35,
    currentTask: "Development",
    deadlineLabel: "In 12 days",
    value: 6500,
    paid: 2000,
    currency: "GBP",
    description: "Launch campaign site and asset kit for Atelier Home.",
  },
  {
    id: "p-marketing",
    slug: "marketing-website",
    name: "Marketing Website",
    clientId: "c-emma",
    clientName: "Atelier Home",
    status: "on-hold",
    progress: 20,
    currentTask: "Final Copy",
    deadlineLabel: "Paused",
    value: 3200,
    paid: 800,
    currency: "GBP",
    description: "Marketing site refresh — paused pending client brief.",
  },
];

export const INITIAL_DEMO_TASKS: DemoTask[] = [
  // Website Redesign
  {
    id: "t-web-1",
    projectId: "p-website",
    name: "Homepage Design",
    status: "completed",
    clientVisible: true,
  },
  {
    id: "t-web-2",
    projectId: "p-website",
    name: "Mobile Layout",
    status: "in-progress",
    clientVisible: true,
  },
  {
    id: "t-web-3",
    projectId: "p-website",
    name: "Final Copy",
    status: "upcoming",
    clientVisible: true,
  },
  {
    id: "t-web-4",
    projectId: "p-website",
    name: "Client Review",
    status: "upcoming",
    clientVisible: true,
    clientAction: "review",
    clientActionLabel: "Review",
    clientActionHint:
      "Your feedback is needed before we move into final development.",
  },
  {
    id: "t-web-5",
    projectId: "p-website",
    name: "Internal QA notes",
    status: "upcoming",
    clientVisible: false,
  },
  // Brand Identity
  {
    id: "t-brand-1",
    projectId: "p-brand",
    name: "Logo exploration",
    status: "completed",
    clientVisible: true,
  },
  {
    id: "t-brand-2",
    projectId: "p-brand",
    name: "Brand Guidelines",
    status: "completed",
    clientVisible: true,
  },
  {
    id: "t-brand-3",
    projectId: "p-brand",
    name: "Client Review",
    status: "in-progress",
    clientVisible: true,
    clientAction: "approve",
    clientActionLabel: "Approve",
    clientActionHint: "Everything looks good from our side — confirm to proceed.",
  },
  {
    id: "t-brand-4",
    projectId: "p-brand",
    name: "Final Approval",
    status: "upcoming",
    clientVisible: true,
  },
  // Product Launch
  {
    id: "t-launch-1",
    projectId: "p-launch",
    name: "Homepage Design",
    status: "completed",
    clientVisible: true,
  },
  {
    id: "t-launch-2",
    projectId: "p-launch",
    name: "Development",
    status: "in-progress",
    clientVisible: true,
  },
  {
    id: "t-launch-3",
    projectId: "p-launch",
    name: "Final Assets",
    status: "upcoming",
    clientVisible: false,
  },
  {
    id: "t-launch-4",
    projectId: "p-launch",
    name: "Final Approval",
    status: "upcoming",
    clientVisible: true,
    clientAction: "approve",
    clientActionLabel: "Approve",
    clientActionHint: "Approve the launch when you're ready.",
  },
  // Marketing Website
  {
    id: "t-mkt-1",
    projectId: "p-marketing",
    name: "Project Brief",
    status: "completed",
    clientVisible: true,
  },
  {
    id: "t-mkt-2",
    projectId: "p-marketing",
    name: "Final Copy",
    status: "in-progress",
    clientVisible: true,
    clientAction: "feedback",
    clientActionLabel: "Send Feedback",
    clientActionHint: "Share copy notes when you have them.",
  },
  {
    id: "t-mkt-3",
    projectId: "p-marketing",
    name: "Development",
    status: "upcoming",
    clientVisible: true,
  },
];

export const INITIAL_DEMO_FILES: DemoFile[] = [
  {
    id: "f1",
    projectId: "p-website",
    name: "Homepage.fig",
    meta: "Shared yesterday",
    clientVisible: true,
  },
  {
    id: "f2",
    projectId: "p-website",
    name: "Project Brief.pdf",
    meta: "Shared 1 week ago",
    clientVisible: true,
  },
  {
    id: "f3",
    projectId: "p-website",
    name: "Internal_wireframes.fig",
    meta: "Internal only",
    clientVisible: false,
  },
  {
    id: "f3b",
    projectId: "p-website",
    name: "Internal Notes.pdf",
    meta: "Internal only",
    clientVisible: false,
  },
  {
    id: "f3c",
    projectId: "p-website",
    name: "Brand Guidelines.pdf",
    meta: "Shared 3 days ago",
    clientVisible: true,
  },
  {
    id: "f3d",
    projectId: "p-website",
    name: "Final Assets.zip",
    meta: "Shared yesterday",
    clientVisible: true,
  },
  {
    id: "f4",
    projectId: "p-brand",
    name: "Brand Guidelines.pdf",
    meta: "Shared 2 days ago",
    clientVisible: true,
  },
  {
    id: "f5",
    projectId: "p-brand",
    name: "Final Assets.zip",
    meta: "Shared yesterday",
    clientVisible: true,
  },
  {
    id: "f6",
    projectId: "p-launch",
    name: "Homepage.fig",
    meta: "Shared 3 days ago",
    clientVisible: true,
  },
  {
    id: "f7",
    projectId: "p-marketing",
    name: "Project Brief.pdf",
    meta: "Shared 2 weeks ago",
    clientVisible: true,
  },
];

export const INITIAL_DEMO_INVOICES: DemoInvoice[] = [
  {
    id: "inv-1",
    projectId: "p-website",
    number: "INV-001",
    amount: 2100,
    status: "paid",
    dateLabel: "Paid Sep 2",
  },
  {
    id: "inv-2",
    projectId: "p-website",
    number: "INV-002",
    amount: 1200,
    status: "due",
    dateLabel: "Due Sep 28",
  },
  {
    id: "inv-3",
    projectId: "p-website",
    number: "INV-003",
    amount: 1500,
    status: "due",
    dateLabel: "Due Oct 10",
  },
  {
    id: "inv-4",
    projectId: "p-brand",
    number: "INV-001",
    amount: 2800,
    status: "paid",
    dateLabel: "Paid Aug 20",
  },
  {
    id: "inv-5",
    projectId: "p-launch",
    number: "INV-001",
    amount: 2000,
    status: "paid",
    dateLabel: "Paid Sep 5",
  },
  {
    id: "inv-6",
    projectId: "p-launch",
    number: "INV-002",
    amount: 2500,
    status: "partial",
    dateLabel: "Partial · Sep 18",
  },
];

export const INITIAL_DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "m1",
    projectId: "p-website",
    author: "client",
    authorName: "Sarah Mitchell",
    body: "The homepage direction looks great.",
    time: "Yesterday",
    clientVisible: true,
  },
  {
    id: "m2",
    projectId: "p-website",
    author: "client",
    authorName: "Sarah Mitchell",
    body: "Could we adjust the hero section before final approval?",
    time: "Yesterday",
    clientVisible: true,
  },
  {
    id: "m3",
    projectId: "p-website",
    author: "business",
    authorName: "Alex Rivera",
    body: "Absolutely. We've updated the design for you.",
    time: "Today",
    clientVisible: true,
  },
  {
    id: "m-internal-1",
    projectId: "p-website",
    author: "business",
    authorName: "Alex Rivera",
    body: "Internal note: keep mobile nav sticky — don't share with client yet.",
    time: "Today",
    clientVisible: false,
  },
  {
    id: "m4",
    projectId: "p-brand",
    author: "client",
    authorName: "Daniel Reed",
    body: "Everything looks good from our side.",
    time: "2 days ago",
    clientVisible: true,
  },
];

export function portalTaskStatusLabel(task: DemoTask): string {
  if (task.status === "completed") return "Completed";
  if (task.status === "in-progress") return "In progress";
  if (task.clientAction) return "Waiting for client";
  return "Upcoming";
}

export function paymentAmountClass(status: DemoPaymentStatus): string {
  switch (status) {
    case "paid":
      return "text-success";
    case "due":
    case "partial":
      return "text-warning";
    case "overdue":
      return "text-danger";
    default:
      return "text-ink";
  }
}

export const INITIAL_DEMO_ACTIVITY: DemoActivity[] = [
  {
    id: "a1",
    description: "Sarah viewed the Website Redesign portal",
    time: "2h ago",
    category: "portal",
  },
  {
    id: "a2",
    description: "Homepage Design marked complete",
    time: "Yesterday",
    category: "task",
  },
  {
    id: "a3",
    description: "INV-002 sent to Northline Coffee",
    time: "2 days ago",
    category: "payment",
  },
  {
    id: "a4",
    description: "Brand Guidelines.pdf shared with Arc Studio",
    time: "2 days ago",
    category: "file",
  },
];

export const INITIAL_DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "n1",
    title: "Client message",
    context: "Sarah asked about the hero section",
    time: "2h ago",
    read: false,
  },
  {
    id: "n2",
    title: "Invoice due soon",
    context: "INV-002 · Northline Coffee",
    time: "Yesterday",
    read: false,
  },
  {
    id: "n3",
    title: "Portal viewed",
    context: "Daniel opened Brand Identity",
    time: "2 days ago",
    read: true,
  },
];

export function createInitialDemoSnapshot() {
  return {
    clients: structuredClone(INITIAL_DEMO_CLIENTS),
    projects: structuredClone(INITIAL_DEMO_PROJECTS),
    tasks: structuredClone(INITIAL_DEMO_TASKS),
    files: structuredClone(INITIAL_DEMO_FILES),
    invoices: structuredClone(INITIAL_DEMO_INVOICES),
    messages: structuredClone(INITIAL_DEMO_MESSAGES),
    activity: structuredClone(INITIAL_DEMO_ACTIVITY),
    notifications: structuredClone(INITIAL_DEMO_NOTIFICATIONS),
  };
}

export function computeProgress(tasks: DemoTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

export function currentTaskLabel(tasks: DemoTask[]): string {
  const active = tasks.find((t) => t.status === "in-progress");
  if (active) return active.name;
  const next = tasks.find((t) => t.status === "upcoming");
  if (next) return next.name;
  return "All tasks complete";
}

export function formatDemoMoney(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
