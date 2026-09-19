import {
  projectDetail,
  projectFiles,
  projectInvoices,
  projectMessages,
  projectTasks,
} from "./projectDetailMock";

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
  firstName: "Sarah",
  fullName: "Sarah Johnson",
};

export const portalProject = {
  ...projectDetail,
  slug: "acme-website",
  portalUrl: "/p/acme-website",
  greeting: `Hi ${portalClient.firstName}, here's the latest progress on your project.`,
  statusMessage: "We're currently building the approved homepage and preparing the next project update.",
  nextUp: {
    title: "Development",
    description:
      "We're currently building the approved homepage and preparing the next project update.",
    expectedUpdate: "Friday",
  },
};

const completedDates: Record<string, string> = {
  t1: "Sep 2",
  t2: "Sep 8",
  t3: "Sep 14",
  t4: "Sep 18",
  t8: "Sep 12",
  t9: "Sep 13",
  t10: "Sep 15",
  t11: "Sep 16",
};

const clientDescriptions: Record<string, string> = {
  t1: "Kickoff and requirements gathering.",
  t2: "Structure and layout exploration.",
  t3: "Visual design for the homepage.",
  t4: "Your feedback and sign-off.",
  t5: "Building the approved designs.",
  t6: "Responsive implementation for mobile.",
};

function displayTaskName(name: string) {
  return name
    .replace(" Call", "")
    .replace("Homepage design", "Homepage Design")
    .replace("Client approval", "Client Approval")
    .replace("Homepage Development", "Development");
}

/** Client-visible tasks only — private tasks never included. */
export const portalTasks: PortalTask[] = (() => {
  const visible = projectTasks.filter((t) => t.visibleToClient);
  const firstIncomplete = visible.findIndex((t) => !t.done);
  return visible.map((t, index) => {
    let status: PortalTaskStatus = "upcoming";
    if (t.done) status = "completed";
    else if (index === firstIncomplete) status = "in-progress";
    return {
      id: t.id,
      name: displayTaskName(t.name),
      status,
      description: clientDescriptions[t.id] ?? t.description,
      completedAt: t.done ? completedDates[t.id] : undefined,
    };
  });
})();

export function portalProgressFromTasks(tasks: PortalTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { progress, completed, total };
}

export const portalFiles = projectFiles.filter((f) => f.visibleToClient);

/** Outstanding invoice for pay CTA — never expose paid-as-unpaid. */
export const portalInvoice =
  projectInvoices.find((i) => i.status === "due" || i.status === "overdue") ??
  projectInvoices.find((i) => i.remaining > 0) ??
  null;

export type PortalMessage = {
  id: string;
  author: "client" | "freelancer";
  name: string;
  body: string;
  time: string;
  failed?: boolean;
};

export const portalMessages: PortalMessage[] = projectMessages.map((m) => ({
  ...m,
  name:
    m.author === "freelancer"
      ? portalBusiness.ownerFirstName
      : m.name === "Sarah Johnson"
        ? portalClient.firstName
        : m.name,
}));

export function paymentStatusLabel(
  status: string,
): string {
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
