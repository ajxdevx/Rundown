import type { PaymentStatus } from "@/data/dashboardMock";

export type ClientStatus = "active" | "inactive";

export type ClientProject = {
  id: string;
  name: string;
  slug: string;
  progress: number;
  deadline: string;
  value: number;
  paymentStatus: PaymentStatus;
  status: "active" | "completed" | "on-hold" | "draft" | "archived";
  completedAt?: string;
};

export type ClientActivity = {
  id: string;
  text: string;
  time: string;
};

export type Client = {
  id: string;
  workspaceId?: string;
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

/** No static seed here — live seed lives in `seedWorkspace` + clientsStore. */
export const seedClients: Client[] = [];

export function clientStats(client: Client) {
  const activeProjects = client.projects.filter(
    (p) => p.status === "active",
  ).length;
  const totalProjects = client.projects.length;
  const totalValue = client.projects.reduce((sum, p) => sum + p.value, 0);
  return { activeProjects, totalProjects, totalValue };
}
