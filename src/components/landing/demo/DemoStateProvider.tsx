"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_WORKSPACE,
  computeProgress,
  createInitialDemoSnapshot,
  currentTaskLabel,
  type DemoActivity,
  type DemoClient,
  type DemoFile,
  type DemoInvoice,
  type DemoMessage,
  type DemoNotification,
  type DemoPortalSection,
  type DemoProject,
  type DemoProjectTab,
  type DemoTask,
  type DemoView,
} from "@/data/demoWorkspace";
import { trackLanding } from "@/lib/landingAnalytics";

type DemoSnapshot = ReturnType<typeof createInitialDemoSnapshot>;

type DemoStateValue = {
  workspace: typeof DEMO_WORKSPACE;
  view: DemoView;
  projectTab: DemoProjectTab;
  portalSection: DemoPortalSection;
  selectedProjectId: string | null;
  selectedClientId: string | null;
  createModalOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  messageDraft: string;
  portalMessageDraft: string;
  invoiceModalId: string | null;
  clients: DemoClient[];
  projects: DemoProject[];
  tasks: DemoTask[];
  files: DemoFile[];
  invoices: DemoInvoice[];
  messages: DemoMessage[];
  activity: DemoActivity[];
  notifications: DemoNotification[];
  selectedProject: DemoProject | null;
  selectedClient: DemoClient | null;
  projectTasks: DemoTask[];
  projectFiles: DemoFile[];
  projectInvoices: DemoInvoice[];
  projectMessages: DemoMessage[];
  portalMessages: DemoMessage[];
  portalClient: DemoClient | null;
  unreadCount: number;
  navigate: (view: DemoView) => void;
  openProject: (projectId: string, tab?: DemoProjectTab) => void;
  openClient: (clientId: string) => void;
  openPortal: (projectId?: string) => void;
  setProjectTab: (tab: DemoProjectTab) => void;
  setPortalSection: (section: DemoPortalSection) => void;
  setCreateModalOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setMessageDraft: (v: string) => void;
  setPortalMessageDraft: (v: string) => void;
  openInvoiceModal: (invoiceId: string) => void;
  closeInvoiceModal: () => void;
  completeTask: (taskId: string) => void;
  completeClientAction: (taskId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;
  sendMessage: () => void;
  sendPortalMessage: () => void;
  createProject: (input: { name: string; clientId: string }) => void;
  copyPortalLink: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemo: () => void;
  tasksFor: (projectId: string) => DemoTask[];
  filesFor: (projectId: string) => DemoFile[];
  invoicesFor: (projectId: string) => DemoInvoice[];
};

const DemoStateContext = createContext<DemoStateValue | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot>(createInitialDemoSnapshot);
  const [view, setView] = useState<DemoView>("dashboard");
  const [projectTab, setProjectTab] = useState<DemoProjectTab>("overview");
  const [portalSection, setPortalSection] =
    useState<DemoPortalSection>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    "p-website",
  );
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [portalMessageDraft, setPortalMessageDraft] = useState("");
  const [invoiceModalId, setInvoiceModalId] = useState<string | null>(null);

  const {
    clients,
    projects,
    tasks,
    files,
    invoices,
    messages,
    activity,
    notifications,
  } = snapshot;

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedClient =
    clients.find((c) => c.id === selectedClientId) ?? null;

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId],
  );
  const projectFiles = useMemo(
    () => files.filter((f) => f.projectId === selectedProjectId),
    [files, selectedProjectId],
  );
  const projectInvoices = useMemo(
    () => invoices.filter((i) => i.projectId === selectedProjectId),
    [invoices, selectedProjectId],
  );
  const projectMessages = useMemo(
    () => messages.filter((m) => m.projectId === selectedProjectId),
    [messages, selectedProjectId],
  );
  const portalMessages = useMemo(
    () =>
      messages.filter(
        (m) => m.projectId === selectedProjectId && m.clientVisible,
      ),
    [messages, selectedProjectId],
  );

  const portalClient = useMemo(() => {
    if (!selectedProject) return null;
    return clients.find((c) => c.id === selectedProject.clientId) ?? null;
  }, [clients, selectedProject]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navigate = useCallback((next: DemoView) => {
    trackLanding("demo_view_switch", { view: next });
    setView(next);
    setSearchOpen(false);
    if (next === "clients") {
      setSelectedClientId((prev) => prev ?? "c-sarah");
    }
    if (next !== "project" && next !== "portal") {
      setProjectTab("overview");
    }
  }, []);

  const openProject = useCallback(
    (projectId: string, tab: DemoProjectTab = "overview") => {
      setSelectedProjectId(projectId);
      setProjectTab(tab);
      setView("project");
      setSearchOpen(false);
      trackLanding("demo_view_switch", { view: "project", projectId });
    },
    [],
  );

  const openClient = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setView("clients");
    setSearchOpen(false);
    trackLanding("demo_view_switch", { view: "clients", clientId });
  }, []);

  const openPortal = useCallback(
    (projectId?: string) => {
      const id = projectId ?? selectedProjectId;
      if (!id) return;
      setSelectedProjectId(id);
      setPortalSection("overview");
      setView("portal");
      setSearchOpen(false);
      trackLanding("portal_demo_interact", { action: "open", projectId: id });
    },
    [selectedProjectId],
  );

  const openInvoiceModal = useCallback((invoiceId: string) => {
    setInvoiceModalId(invoiceId);
  }, []);

  const closeInvoiceModal = useCallback(() => {
    setInvoiceModalId(null);
  }, []);

  const completeTask = useCallback(
    (taskId: string) => {
      setSnapshot((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task || task.status === "completed") return prev;

        let nextTasks = prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: "completed" as const } : t,
        );

        // Promote next upcoming task in the same project to in-progress
        const hasInProgress = nextTasks.some(
          (t) => t.projectId === task.projectId && t.status === "in-progress",
        );
        if (!hasInProgress) {
          const nextUpcoming = nextTasks.find(
            (t) => t.projectId === task.projectId && t.status === "upcoming",
          );
          if (nextUpcoming) {
            nextTasks = nextTasks.map((t) =>
              t.id === nextUpcoming.id
                ? { ...t, status: "in-progress" as const }
                : t,
            );
          }
        }

        const scoped = nextTasks.filter((t) => t.projectId === task.projectId);
        const progress = computeProgress(scoped);
        const currentTask = currentTaskLabel(scoped);

        return {
          ...prev,
          tasks: nextTasks,
          projects: prev.projects.map((p) =>
            p.id === task.projectId ? { ...p, progress, currentTask } : p,
          ),
          activity: [
            {
              id: uid("a"),
              description: `${task.name} marked complete`,
              time: "Just now",
              category: "task" as const,
            },
            ...prev.activity,
          ].slice(0, 12),
        };
      });
    },
    [],
  );

  const markInvoicePaid = useCallback((invoiceId: string) => {
    setSnapshot((prev) => {
      const invoice = prev.invoices.find((i) => i.id === invoiceId);
      if (!invoice || invoice.status === "paid") return prev;

      const nextInvoices = prev.invoices.map((i) =>
        i.id === invoiceId
          ? { ...i, status: "paid" as const, dateLabel: "Paid just now" }
          : i,
      );

      const projectInvoices = nextInvoices.filter(
        (i) => i.projectId === invoice.projectId,
      );
      const paid = projectInvoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);

      return {
        ...prev,
        invoices: nextInvoices,
        projects: prev.projects.map((p) =>
          p.id === invoice.projectId ? { ...p, paid } : p,
        ),
        activity: [
          {
            id: uid("a"),
            description: `${invoice.number} marked as paid`,
            time: "Just now",
            category: "payment" as const,
          },
          ...prev.activity,
        ].slice(0, 12),
      };
    });
  }, []);

  const sendMessage = useCallback(() => {
    const body = messageDraft.trim();
    if (!body || !selectedProjectId) return;

    const project = projects.find((p) => p.id === selectedProjectId);
    setSnapshot((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: uid("m"),
          projectId: selectedProjectId,
          author: "business",
          authorName: DEMO_WORKSPACE.ownerName,
          body,
          time: "Just now",
          clientVisible: true,
        },
      ],
      activity: [
        {
          id: uid("a"),
          description: `Message sent on ${project?.name ?? "project"}`,
          time: "Just now",
          category: "message" as const,
        },
        ...prev.activity,
      ].slice(0, 12),
    }));
    setMessageDraft("");
    trackLanding("portal_demo_interact", { action: "message_sent" });
  }, [messageDraft, selectedProjectId, projects]);

  const sendPortalMessage = useCallback(() => {
    const body = portalMessageDraft.trim();
    if (!body || !selectedProjectId || !selectedProject) return;

    const client =
      clients.find((c) => c.id === selectedProject.clientId) ?? null;
    const authorName = client?.contactName ?? "Client";

    setSnapshot((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: uid("m"),
          projectId: selectedProjectId,
          author: "client",
          authorName,
          body,
          time: "Just now",
          clientVisible: true,
        },
      ],
      activity: [
        {
          id: uid("a"),
          description: `${authorName.split(" ")[0]} sent a portal message`,
          time: "Just now",
          category: "message" as const,
        },
        ...prev.activity,
      ].slice(0, 12),
      notifications: [
        {
          id: uid("n"),
          title: "Client message",
          context: `${authorName} on ${selectedProject.name}`,
          time: "Just now",
          read: false,
        },
        ...prev.notifications,
      ].slice(0, 8),
    }));
    setPortalMessageDraft("");
    trackLanding("portal_demo_interact", { action: "portal_message_sent" });
  }, [
    portalMessageDraft,
    selectedProjectId,
    selectedProject,
    clients,
  ]);

  const completeClientAction = useCallback(
    (taskId: string) => {
      setSnapshot((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task || task.status === "completed") return prev;

        let nextTasks = prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed" as const,
                clientAction: null,
              }
            : t,
        );

        const hasInProgress = nextTasks.some(
          (t) => t.projectId === task.projectId && t.status === "in-progress",
        );
        if (!hasInProgress) {
          const nextUpcoming = nextTasks.find(
            (t) => t.projectId === task.projectId && t.status === "upcoming",
          );
          if (nextUpcoming) {
            nextTasks = nextTasks.map((t) =>
              t.id === nextUpcoming.id
                ? { ...t, status: "in-progress" as const }
                : t,
            );
          }
        }

        const scoped = nextTasks.filter((t) => t.projectId === task.projectId);
        const progress = computeProgress(scoped);
        const currentTask = currentTaskLabel(scoped);
        const project = prev.projects.find((p) => p.id === task.projectId);
        const client = prev.clients.find((c) => c.id === project?.clientId);

        return {
          ...prev,
          tasks: nextTasks,
          projects: prev.projects.map((p) =>
            p.id === task.projectId ? { ...p, progress, currentTask } : p,
          ),
          activity: [
            {
              id: uid("a"),
              description: `${client?.contactFirstName ?? "Client"} completed ${task.name}`,
              time: "Just now",
              category: "task" as const,
            },
            ...prev.activity,
          ].slice(0, 12),
          notifications: [
            {
              id: uid("n"),
              title: "Client action complete",
              context: `${task.name} · ${project?.name ?? "Project"}`,
              time: "Just now",
              read: false,
            },
            ...prev.notifications,
          ].slice(0, 8),
        };
      });
      trackLanding("portal_demo_interact", { action: "client_action" });
    },
    [],
  );

  const createProject = useCallback(
    (input: { name: string; clientId: string }) => {
      const client = clients.find((c) => c.id === input.clientId);
      if (!client || !input.name.trim()) return;

      const id = uid("p");
      const slug = input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const project: DemoProject = {
        id,
        slug: slug || id,
        name: input.name.trim(),
        clientId: client.id,
        clientName: client.name,
        status: "active",
        progress: 0,
        currentTask: "Homepage Design",
        deadlineLabel: "Due in 14 days",
        value: 0,
        paid: 0,
        currency: DEMO_WORKSPACE.currency,
        description: `New project for ${client.name}.`,
      };

      const starterTasks: DemoTask[] = [
        {
          id: uid("t"),
          projectId: id,
          name: "Homepage Design",
          status: "in-progress",
          clientVisible: true,
        },
        {
          id: uid("t"),
          projectId: id,
          name: "Client Review",
          status: "upcoming",
          clientVisible: true,
          clientAction: "review",
          clientActionLabel: "Review",
          clientActionHint: "Review the work when it's ready.",
        },
      ];

      setSnapshot((prev) => ({
        ...prev,
        projects: [project, ...prev.projects],
        tasks: [...prev.tasks, ...starterTasks],
        clients: prev.clients.map((c) =>
          c.id === client.id
            ? { ...c, projectsCount: c.projectsCount + 1 }
            : c,
        ),
        activity: [
          {
            id: uid("a"),
            description: `${project.name} created`,
            time: "Just now",
            category: "project" as const,
          },
          ...prev.activity,
        ].slice(0, 12),
      }));

      setCreateModalOpen(false);
      setSelectedProjectId(id);
      setProjectTab("overview");
      setView("project");
    },
    [clients],
  );

  const copyPortalLink = useCallback(() => {
    trackLanding("portal_demo_interact", { action: "copy_link" });
    // Clipboard may be unavailable in some embeds; still toast success in UI layer.
    void navigator.clipboard?.writeText(
      `https://dueso.app/p/${selectedProject?.slug ?? "demo"}`,
    );
  }, [selectedProject]);

  const markNotificationRead = useCallback((id: string) => {
    setSnapshot((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setSnapshot((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setSnapshot(createInitialDemoSnapshot());
    setView("dashboard");
    setProjectTab("overview");
    setPortalSection("overview");
    setSelectedProjectId("p-website");
    setSelectedClientId(null);
    setCreateModalOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    setMessageDraft("");
    setPortalMessageDraft("");
    setInvoiceModalId(null);
    trackLanding("demo_view_switch", { view: "reset" });
  }, []);

  const tasksFor = useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId),
    [tasks],
  );
  const filesFor = useCallback(
    (projectId: string) => files.filter((f) => f.projectId === projectId),
    [files],
  );
  const invoicesFor = useCallback(
    (projectId: string) => invoices.filter((i) => i.projectId === projectId),
    [invoices],
  );

  const value = useMemo<DemoStateValue>(
    () => ({
      workspace: DEMO_WORKSPACE,
      view,
      projectTab,
      portalSection,
      selectedProjectId,
      selectedClientId,
      createModalOpen,
      searchOpen,
      searchQuery,
      messageDraft,
      portalMessageDraft,
      invoiceModalId,
      clients,
      projects,
      tasks,
      files,
      invoices,
      messages,
      activity,
      notifications,
      selectedProject,
      selectedClient,
      projectTasks,
      projectFiles,
      projectInvoices,
      projectMessages,
      portalMessages,
      portalClient,
      unreadCount,
      navigate,
      openProject,
      openClient,
      openPortal,
      setProjectTab,
      setPortalSection,
      setCreateModalOpen,
      setSearchOpen,
      setSearchQuery,
      setMessageDraft,
      setPortalMessageDraft,
      openInvoiceModal,
      closeInvoiceModal,
      completeTask,
      completeClientAction,
      markInvoicePaid,
      sendMessage,
      sendPortalMessage,
      createProject,
      copyPortalLink,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemo,
      tasksFor,
      filesFor,
      invoicesFor,
    }),
    [
      view,
      projectTab,
      portalSection,
      selectedProjectId,
      selectedClientId,
      createModalOpen,
      searchOpen,
      searchQuery,
      messageDraft,
      portalMessageDraft,
      invoiceModalId,
      clients,
      projects,
      tasks,
      files,
      invoices,
      messages,
      activity,
      notifications,
      selectedProject,
      selectedClient,
      projectTasks,
      projectFiles,
      projectInvoices,
      projectMessages,
      portalMessages,
      portalClient,
      unreadCount,
      navigate,
      openProject,
      openClient,
      openPortal,
      openInvoiceModal,
      closeInvoiceModal,
      completeTask,
      completeClientAction,
      markInvoicePaid,
      sendMessage,
      sendPortalMessage,
      createProject,
      copyPortalLink,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemo,
      tasksFor,
      filesFor,
      invoicesFor,
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState() {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error("useDemoState must be used within DemoStateProvider");
  }
  return ctx;
}
