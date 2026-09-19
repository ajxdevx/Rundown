export type NotifCategory = "projects" | "payments" | "messages" | "clients";

export type NotificationItem = {
  id: string;
  title: string;
  time: string;
  timeGroup: "Today" | "Yesterday" | "Earlier";
  read: boolean;
  category: NotifCategory;
  /** Destination path when clicked */
  href: string;
};

export type ActivityCategory =
  | "projects"
  | "clients"
  | "files"
  | "payments"
  | "messages";

export type ActivityItem = {
  id: string;
  description: string;
  related: string;
  time: string;
  category: ActivityCategory;
  href: string;
};

export const seedNotifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Sarah viewed Website Redesign",
    time: "5 minutes ago",
    timeGroup: "Today",
    read: false,
    category: "clients",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n2",
    title: "Invoice INV-004 was paid",
    time: "1 hour ago",
    timeGroup: "Today",
    read: false,
    category: "payments",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n3",
    title: "Project deadline approaching — Website Redesign",
    time: "3 hours ago",
    timeGroup: "Today",
    read: false,
    category: "projects",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n4",
    title: "Client downloaded Homepage.pdf",
    time: "Yesterday",
    timeGroup: "Yesterday",
    read: true,
    category: "clients",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n5",
    title: "New message from Sarah",
    time: "Yesterday",
    timeGroup: "Yesterday",
    read: true,
    category: "messages",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "n6",
    title: "Invoice INV-003 is overdue",
    time: "2 days ago",
    timeGroup: "Earlier",
    read: true,
    category: "payments",
    href: "/projects/acme-website-redesign",
  },
];

export const seedActivity: ActivityItem[] = [
  {
    id: "a1",
    description: "Client viewed Website Redesign portal",
    related: "Sarah Johnson · Website Redesign",
    time: "10 minutes ago",
    category: "clients",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a2",
    description: "Invoice #INV-003 was paid",
    related: "Website Redesign",
    time: "2 hours ago",
    category: "payments",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a3",
    description: "Homepage Design completed",
    related: "Website Redesign",
    time: "Yesterday",
    category: "projects",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a4",
    description: "Homepage.pdf downloaded",
    related: "Sarah Johnson · Website Redesign",
    time: "Yesterday",
    category: "files",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a5",
    description: "Alex uploaded Brand Guidelines.pdf",
    related: "Website Redesign",
    time: "2 days ago",
    category: "files",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a6",
    description: "New message from Sarah",
    related: "Website Redesign",
    time: "2 days ago",
    category: "messages",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a7",
    description: "Project created — Brand Identity",
    related: "Sarah Johnson",
    time: "3 days ago",
    category: "projects",
    href: "/projects/acme-website-redesign",
  },
  {
    id: "a8",
    description: "Client returned to portal",
    related: "Maya Chen · Lumen Health",
    time: "4 days ago",
    category: "clients",
    href: "/clients/c3",
  },
];
