export type NotifCategory =
  | "projects"
  | "clients"
  | "payments"
  | "messages"
  | "tasks"
  | "files";

export type NotifPriority = "normal" | "important" | "action";

export type NotificationItem = {
  id: string;
  workspaceId: string;
  title: string;
  /** Project · Client style supporting line */
  context: string;
  time: string;
  /** ISO timestamp for sorting */
  createdAt: string;
  timeGroup: "Today" | "Yesterday" | "Earlier";
  read: boolean;
  category: NotifCategory;
  priority: NotifPriority;
  /** Destination path when clicked */
  href: string;
  /** Optional financial amount shown with semantic color */
  amount?: string;
  paymentStatus?: "paid" | "due" | "overdue" | "processing" | "failed";
};

/** Seed belongs to default workspace `ws_acme`. */
export const seedNotifications: NotificationItem[] = [
  {
    id: "n1",
    workspaceId: "ws_acme",
    title: "Sarah sent you a message",
    context: "Website Redesign · Sarah",
    time: "12 min ago",
    createdAt: "2026-09-21T02:48:00.000Z",
    timeGroup: "Today",
    read: false,
    category: "messages",
    priority: "action",
    href: "/projects/acme-website-redesign?tab=messages",
  },
  {
    id: "n2",
    workspaceId: "ws_acme",
    title: "Client approval required for Homepage Design",
    context: "Website Redesign · Sarah",
    time: "45 min ago",
    createdAt: "2026-09-21T02:15:00.000Z",
    timeGroup: "Today",
    read: false,
    category: "tasks",
    priority: "action",
    href: "/projects/acme-website-redesign?tab=tasks",
  },
  {
    id: "n3",
    workspaceId: "ws_acme",
    title: "Invoice INV-004 is overdue",
    context: "Website Redesign",
    time: "2 hr ago",
    createdAt: "2026-09-21T00:30:00.000Z",
    timeGroup: "Today",
    read: false,
    category: "payments",
    priority: "important",
    href: "/projects/acme-website-redesign?tab=invoices",
    amount: "$1,200",
    paymentStatus: "overdue",
  },
  {
    id: "n4",
    workspaceId: "ws_acme",
    title: "Sarah uploaded Final Design.pdf",
    context: "Website Redesign · Files",
    time: "Yesterday",
    createdAt: "2026-09-20T16:00:00.000Z",
    timeGroup: "Yesterday",
    read: true,
    category: "files",
    priority: "normal",
    href: "/projects/acme-website-redesign?tab=files",
  },
  {
    id: "n5",
    workspaceId: "ws_acme",
    title: "Invoice INV-003 was paid",
    context: "Website Redesign",
    time: "Yesterday",
    createdAt: "2026-09-20T11:00:00.000Z",
    timeGroup: "Yesterday",
    read: true,
    category: "payments",
    priority: "normal",
    href: "/projects/acme-website-redesign?tab=invoices",
    amount: "$800",
    paymentStatus: "paid",
  },
  {
    id: "n6",
    workspaceId: "ws_acme",
    title: "Website Redesign deadline is approaching",
    context: "Due in 5 days · Acme Studio",
    time: "2 days ago",
    createdAt: "2026-09-19T09:00:00.000Z",
    timeGroup: "Earlier",
    read: true,
    category: "projects",
    priority: "important",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n7",
    workspaceId: "ws_acme",
    title: "Sarah requested changes to Homepage Design",
    context: "Website Redesign · Tasks",
    time: "3 days ago",
    createdAt: "2026-09-18T14:00:00.000Z",
    timeGroup: "Earlier",
    read: true,
    category: "tasks",
    priority: "action",
    href: "/projects/acme-website-redesign?tab=tasks",
  },
];
