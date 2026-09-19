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

export type ProjectTask = {
  id: string;
  name: string;
  description?: string;
  done: boolean;
  visibleToClient: boolean;
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
};

export const projectDetail: ProjectDetail = {
  id: "1",
  slug: "acme-website-redesign",
  name: "Website Redesign",
  client: "Acme Studio",
  clientId: "c1",
  clientEmail: "sarah@acmestudio.com",
  status: "active",
  description:
    "Redesign the company's marketing website with a new visual system and responsive implementation.",
  deadline: "Sep 24, 2026",
  deadlineLabel: "September 24, 2026",
  deadlineRelative: "Due in 5 days",
  daysRemaining: 5,
  overdue: false,
  value: 2400,
  currency: "USD",
  paid: 1200,
  remaining: 1200,
  paymentState: "due",
  progress: 72,
  tasksCompleted: 8,
  tasksTotal: 11,
  nextUp: {
    title: "Homepage Development",
    description:
      "Build the approved homepage design and prepare it for client review.",
  },
  portalUrl: "/p/acme-website",
  lastPortalView: "2 hours ago",
  createdAt: "Aug 1, 2026",
  updatedAt: "Sep 19, 2026",
};

export const projectTasks: ProjectTask[] = [
  {
    id: "t1",
    name: "Discovery Call",
    done: true,
    visibleToClient: true,
  },
  { id: "t2", name: "Wireframes", done: true, visibleToClient: true },
  {
    id: "t3",
    name: "Homepage Design",
    done: true,
    visibleToClient: true,
  },
  {
    id: "t4",
    name: "Client Approval",
    done: true,
    visibleToClient: true,
  },
  {
    id: "t5",
    name: "Homepage Development",
    description: "Build the approved homepage design.",
    done: false,
    visibleToClient: true,
  },
  {
    id: "t6",
    name: "Mobile Development",
    done: false,
    visibleToClient: true,
  },
  { id: "t7", name: "QA", done: false, visibleToClient: false },
  {
    id: "t8",
    name: "Content migration",
    done: true,
    visibleToClient: true,
  },
  {
    id: "t9",
    name: "SEO setup",
    done: true,
    visibleToClient: true,
  },
  {
    id: "t10",
    name: "Analytics install",
    done: true,
    visibleToClient: true,
  },
  {
    id: "t11",
    name: "Launch checklist",
    done: true,
    visibleToClient: true,
  },
];

export const projectFiles: ProjectFile[] = [
  {
    id: "f1",
    name: "Final Design.pdf",
    type: "PDF",
    size: "4.2 MB",
    uploaded: "Sep 18",
    visibleToClient: true,
  },
  {
    id: "f2",
    name: "Brand Guidelines.pdf",
    type: "PDF",
    size: "2.1 MB",
    uploaded: "Sep 17",
    visibleToClient: true,
  },
  {
    id: "f3",
    name: "Internal Notes.pdf",
    type: "PDF",
    size: "900 KB",
    uploaded: "Sep 16",
    visibleToClient: false,
  },
];

export const projectInvoices: ProjectInvoice[] = [
  {
    id: "i1",
    number: "INV-001",
    title: "Website Design",
    amount: 1200,
    due: "Sep 10",
    paid: 1200,
    remaining: 0,
    status: "paid",
    hasPaymentLink: true,
  },
  {
    id: "i2",
    number: "INV-002",
    title: "Development",
    amount: 1200,
    due: "Sep 24",
    paid: 0,
    remaining: 1200,
    status: "due",
    hasPaymentLink: true,
  },
];

export const projectMessages: ProjectMessage[] = [
  {
    id: "m1",
    author: "client",
    name: "Sarah",
    body: "The homepage looks great. Could we adjust the hero section?",
    time: "2 hours ago",
  },
  {
    id: "m2",
    author: "freelancer",
    name: "Alex",
    body: "Absolutely, I'll update that today.",
    time: "1 hour ago",
  },
];

export const projectActivity: ProjectActivity[] = [
  { id: "a1", text: "Sarah viewed the client portal", time: "2 hours ago" },
  {
    id: "a2",
    text: "Final Design.pdf uploaded",
    time: "Yesterday",
  },
  { id: "a3", text: "Homepage Design completed", time: "Yesterday" },
  { id: "a4", text: "Invoice INV-001 marked paid", time: "Sep 15" },
  { id: "a5", text: "Client Approval completed", time: "Sep 14" },
];
