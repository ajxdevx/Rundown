export type ActivityCategory =
  | "projects"
  | "clients"
  | "tasks"
  | "files"
  | "invoices"
  | "messages"
  | "portal"
  | "workspace";

export type ActivityActorKind = "you" | "user" | "client" | "system";

export type ActivityTimeGroup = "Today" | "Yesterday" | "Earlier";

export type ActivityPaymentStatus =
  | "paid"
  | "due"
  | "overdue"
  | "processing"
  | "failed";

export type ActivityEvent = {
  id: string;
  workspaceId: string;
  /** Human-readable timeline copy */
  description: string;
  /** Supporting context line */
  context: string;
  /** Relative display time */
  time: string;
  /** ISO timestamp for sorting */
  createdAt: string;
  timeGroup: ActivityTimeGroup;
  category: ActivityCategory;
  href: string;
  actorKind: ActivityActorKind;
  actorName?: string;
  projectId?: string;
  projectSlug?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  amount?: string;
  paymentStatus?: ActivityPaymentStatus;
  /** Underlying object was deleted */
  targetUnavailable?: boolean;
};

/** Seed belongs to default workspace `ws_acme`. */
export const seedActivity: ActivityEvent[] = [
  {
    id: "a1",
    workspaceId: "ws_acme",
    description: "Sarah viewed Website Redesign",
    context: "Client Portal",
    time: "12 min ago",
    createdAt: "2026-09-21T02:48:00.000Z",
    timeGroup: "Today",
    category: "portal",
    href: "/projects/acme-website-redesign",
    actorKind: "client",
    actorName: "Sarah",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
  },
  {
    id: "a2",
    workspaceId: "ws_acme",
    description: "Sarah sent a message",
    context: "Website Redesign",
    time: "18 min ago",
    createdAt: "2026-09-21T02:42:00.000Z",
    timeGroup: "Today",
    category: "messages",
    href: "/projects/acme-website-redesign?tab=messages",
    actorKind: "client",
    actorName: "Sarah",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
  },
  {
    id: "a3",
    workspaceId: "ws_acme",
    description: "You completed Homepage Design",
    context: "Website Redesign",
    time: "45 min ago",
    createdAt: "2026-09-21T02:15:00.000Z",
    timeGroup: "Today",
    category: "tasks",
    href: "/projects/acme-website-redesign?tab=tasks",
    actorKind: "you",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
  },
  {
    id: "a4",
    workspaceId: "ws_acme",
    description: "You uploaded Brand Guidelines.pdf",
    context: "Website Redesign",
    time: "2 hr ago",
    createdAt: "2026-09-21T00:50:00.000Z",
    timeGroup: "Today",
    category: "files",
    href: "/projects/acme-website-redesign?tab=files",
    actorKind: "you",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
  },
  {
    id: "a5",
    workspaceId: "ws_acme",
    description: "Invoice INV-004 became overdue",
    context: "Website Redesign · Acme Studio",
    time: "3 hr ago",
    createdAt: "2026-09-20T23:30:00.000Z",
    timeGroup: "Today",
    category: "invoices",
    href: "/projects/acme-website-redesign?tab=invoices",
    actorKind: "system",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
    amount: "$1,200",
    paymentStatus: "overdue",
  },
  {
    id: "a6",
    workspaceId: "ws_acme",
    description: "John downloaded Final Design.pdf",
    context: "Website Redesign",
    time: "Yesterday",
    createdAt: "2026-09-20T16:00:00.000Z",
    timeGroup: "Yesterday",
    category: "files",
    href: "/projects/acme-website-redesign?tab=files",
    actorKind: "client",
    actorName: "John",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
  },
  {
    id: "a7",
    workspaceId: "ws_acme",
    description: "Invoice INV-003 was paid",
    context: "Website Redesign · Acme Studio",
    time: "Yesterday",
    createdAt: "2026-09-20T11:00:00.000Z",
    timeGroup: "Yesterday",
    category: "invoices",
    href: "/projects/acme-website-redesign?tab=invoices",
    actorKind: "client",
    actorName: "Acme Studio",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
    amount: "$800",
    paymentStatus: "paid",
  },
  {
    id: "a8",
    workspaceId: "ws_acme",
    description: "Sarah requested changes to Homepage Design",
    context: "Website Redesign",
    time: "Yesterday",
    createdAt: "2026-09-20T09:30:00.000Z",
    timeGroup: "Yesterday",
    category: "tasks",
    href: "/projects/acme-website-redesign?tab=tasks",
    actorKind: "client",
    actorName: "Sarah",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
  },
  {
    id: "a9",
    workspaceId: "ws_acme",
    description: "You moved Website Redesign to Active",
    context: "Website Redesign",
    time: "2 days ago",
    createdAt: "2026-09-19T09:00:00.000Z",
    timeGroup: "Earlier",
    category: "projects",
    href: "/projects/acme-website-redesign",
    actorKind: "you",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
  },
  {
    id: "a10",
    workspaceId: "ws_acme",
    description: "You created Website Redesign",
    context: "Acme Studio",
    time: "5 days ago",
    createdAt: "2026-09-16T14:00:00.000Z",
    timeGroup: "Earlier",
    category: "projects",
    href: "/projects/acme-website-redesign",
    actorKind: "you",
    projectSlug: "acme-website-redesign",
    projectName: "Website Redesign",
    clientName: "Acme Studio",
  },
  {
    id: "a11",
    workspaceId: "ws_acme",
    description: "You added Acme Studio",
    context: "Clients",
    time: "5 days ago",
    createdAt: "2026-09-16T13:45:00.000Z",
    timeGroup: "Earlier",
    category: "clients",
    href: "/clients",
    actorKind: "you",
    clientName: "Acme Studio",
  },
];
