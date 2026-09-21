/**
 * Demo-only data for the marketing landing page.
 * Never wired to auth, Supabase, or real workspaces.
 */

export const landingBusiness = {
  workspaceName: "Alex Design Studio",
  ownerName: "Alex Johnson",
  ownerFirstName: "Alex",
};

export const landingClient = {
  name: "Acme Studio",
  contactFirstName: "Jordan",
};

export const landingProject = {
  id: "demo-website-redesign",
  slug: "website-redesign",
  name: "Website Redesign",
  client: landingClient.name,
  status: "active" as const,
  progress: 68,
  currentTask: "Client Approval",
  deadlineLabel: "Due in 5 days",
  value: 4200,
  paid: 3000,
  remaining: 1200,
  currency: "GBP",
  invoice: "INV-003",
  invoiceAmount: 1200,
  paymentStatus: "due" as const,
};

export const landingTasks = [
  { id: "t1", name: "Homepage Design", status: "completed" as const },
  { id: "t2", name: "Mobile Adjustments", status: "completed" as const },
  { id: "t3", name: "Client Approval", status: "in-progress" as const },
  { id: "t4", name: "Final Files", status: "upcoming" as const },
];

export const landingActivity = [
  {
    id: "a1",
    description: "Jordan viewed the portal",
    time: "2h ago",
    category: "portal" as const,
  },
  {
    id: "a2",
    description: "Homepage Design marked complete",
    time: "Yesterday",
    category: "task" as const,
  },
  {
    id: "a3",
    description: "INV-003 sent to Acme Studio",
    time: "2 days ago",
    category: "payment" as const,
  },
];

export const landingPortal = {
  greeting: `Hi ${landingClient.contactFirstName},`,
  statusMessage: "Your redesign is on track. We're waiting on your approval for the homepage.",
  nextUp: {
    title: "Review homepage designs",
    description: "Approve the latest homepage direction so we can lock mobile adjustments.",
    expectedUpdate: "Expected this week",
  },
  sharedFiles: [
    { id: "f1", name: "Homepage_v3.fig", meta: "Shared yesterday" },
    { id: "f2", name: "Brand_tokens.pdf", meta: "Shared 3 days ago" },
  ],
};

export const landingAudiences = [
  "Freelancers",
  "Agencies",
  "Studios",
  "Consultants",
  "Developers",
  "Designers",
  "Marketing teams",
] as const;

export const landingWorkflowSteps = [
  {
    id: "w1",
    title: "Set up the project",
    description: "Create the project, attach the client, and define what work is visible.",
  },
  {
    id: "w2",
    title: "Run the work internally",
    description: "Track tasks, files, messages, and payments inside your workspace.",
  },
  {
    id: "w3",
    title: "Share a client portal",
    description: "Give clients a focused view of progress, files, approvals, and payment.",
  },
] as const;

export const landingFaqs = [
  {
    id: "faq-1",
    question: "Who is Dueso for?",
    answer:
      "Freelancers, agencies, studios, consultants, developers, designers, and other service businesses that manage client projects.",
  },
  {
    id: "faq-2",
    question: "What is the Client Portal?",
    answer:
      "A professional, focused experience for each client — progress, shared files, next steps, messages, approvals, and payment — without exposing your internal workspace.",
  },
  {
    id: "faq-3",
    question: "Is Dueso available now?",
    answer:
      "Dueso is opening early access. Join the waitlist to get invited as we roll out.",
  },
  {
    id: "faq-4",
    question: "Will I need to invite clients into my workspace?",
    answer:
      "No. Clients get their own portal experience. Your internal tasks, notes, and private files stay on the business side.",
  },
] as const;

export const landingNavLinks = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#client-portal", label: "Client Portal" },
  { href: "#pricing", label: "Pricing" },
] as const;
