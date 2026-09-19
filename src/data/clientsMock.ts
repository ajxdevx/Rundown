export type ClientStatus = "active" | "inactive";

export type ClientProject = {
  id: string;
  name: string;
  slug: string;
  progress: number;
  deadline: string;
  value: number;
  status: "active" | "completed" | "on-hold";
  completedAt?: string;
};

export type ClientActivity = {
  id: string;
  text: string;
  time: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  status: ClientStatus;
  lastActive: string;
  lastActiveSort: number;
  createdAt: string;
  createdSort: number;
  projects: ClientProject[];
  activity: ClientActivity[];
  outstanding: number;
};

export const seedClients: Client[] = [
  {
    id: "c1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    company: "Acme Studio",
    phone: "+1 (555) 012-3344",
    notes: "Prefers async updates. Loves clean sans-serif type.",
    status: "active",
    lastActive: "2 days ago",
    lastActiveSort: 2,
    createdAt: "2026-02-10",
    createdSort: 3,
    outstanding: 1250,
    projects: [
      {
        id: "p1",
        name: "Website Redesign",
        slug: "acme-website-redesign",
        progress: 75,
        deadline: "Sep 28",
        value: 2500,
        status: "active",
      },
      {
        id: "p2",
        name: "Brand Identity",
        slug: "acme-website-redesign",
        progress: 100,
        deadline: "Sep 4",
        value: 1800,
        status: "completed",
        completedAt: "Sep 4",
      },
      {
        id: "p3",
        name: "Landing Page",
        slug: "acme-website-redesign",
        progress: 40,
        deadline: "Oct 20",
        value: 2100,
        status: "active",
      },
      {
        id: "p4",
        name: "Pitch Deck",
        slug: "acme-website-redesign",
        progress: 100,
        deadline: "Aug 12",
        value: 900,
        status: "completed",
        completedAt: "Aug 12",
      },
    ],
    activity: [
      {
        id: "a1",
        text: "Client viewed Website Redesign portal",
        time: "2 days ago",
      },
      {
        id: "a2",
        text: "Client downloaded Homepage.pdf",
        time: "3 days ago",
      },
      { id: "a3", text: "Client paid $750", time: "1 week ago" },
      { id: "a4", text: "Client sent a message", time: "1 week ago" },
    ],
  },
  {
    id: "c2",
    name: "John Smith",
    email: "john@example.com",
    company: null,
    phone: null,
    notes: null,
    status: "active",
    lastActive: "5 days ago",
    lastActiveSort: 5,
    createdAt: "2026-03-01",
    createdSort: 2,
    outstanding: 0,
    projects: [
      {
        id: "p5",
        name: "Marketing Site",
        slug: "acme-website-redesign",
        progress: 42,
        deadline: "Apr 2",
        value: 1500,
        status: "active",
      },
    ],
    activity: [
      {
        id: "a5",
        text: "Client viewed Marketing Site portal",
        time: "5 days ago",
      },
      {
        id: "a6",
        text: "Client hasn't viewed portal yet",
        time: "2 weeks ago",
      },
    ],
  },
  {
    id: "c3",
    name: "Maya Chen",
    email: "maya@lumen.health",
    company: "Lumen Health",
    phone: "+1 (555) 889-2201",
    notes: "Decision maker is Maya; billing goes to finance@lumen.health.",
    status: "active",
    lastActive: "Yesterday",
    lastActiveSort: 1,
    createdAt: "2026-01-18",
    createdSort: 4,
    outstanding: 4600,
    projects: [
      {
        id: "p6",
        name: "Marketing site — Lumen Health",
        slug: "acme-website-redesign",
        progress: 42,
        deadline: "Apr 2",
        value: 9200,
        status: "active",
      },
    ],
    activity: [
      {
        id: "a7",
        text: "Client sent a message",
        time: "Yesterday",
      },
      {
        id: "a8",
        text: "Client viewed Marketing site portal",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "c4",
    name: "Tom Rivera",
    email: "tom@verde.capital",
    company: "Verde Capital",
    phone: null,
    notes: "Paused — waiting on funding round.",
    status: "inactive",
    lastActive: "12 days ago",
    lastActiveSort: 12,
    createdAt: "2025-11-02",
    createdSort: 5,
    outstanding: 1100,
    projects: [
      {
        id: "p7",
        name: "Pitch deck — Verde Capital",
        slug: "acme-website-redesign",
        progress: 25,
        deadline: "Apr 10",
        value: 2200,
        status: "on-hold",
      },
    ],
    activity: [
      {
        id: "a9",
        text: "Client hasn't viewed portal yet",
        time: "12 days ago",
      },
    ],
  },
];

export function clientStats(client: Client) {
  const activeProjects = client.projects.filter(
    (p) => p.status === "active",
  ).length;
  const totalProjects = client.projects.length;
  const totalValue = client.projects.reduce((sum, p) => sum + p.value, 0);
  return { activeProjects, totalProjects, totalValue };
}
