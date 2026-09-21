"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CreditCard,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllClients } from "@/lib/clientsStore";
import { getCreatedProjects } from "@/lib/createProject";
import { useClientModalOptional } from "./ClientModalProvider";
import { useProjectModalOptional } from "./ProjectModalProvider";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) {
    throw new Error("useCommandMenu must be used within CommandMenuProvider");
  }
  return ctx;
}

export function useCommandMenuOptional() {
  return useContext(CommandMenuContext);
}

type Item = {
  id: string;
  label: string;
  group: string;
  href?: string;
  onSelect?: () => void;
  icon: typeof Search;
  keywords?: string;
};

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
  );

  return (
    <CommandMenuContext.Provider value={value}>
      {children}
      <CommandMenuPanel open={open} onClose={() => setOpen(false)} />
    </CommandMenuContext.Provider>
  );
}

function CommandMenuPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const projectModal = useProjectModalOptional();
  const clientModal = useClientModalOptional();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const created = typeof window !== "undefined" ? getCreatedProjects() : [];
    const clients = typeof window !== "undefined" ? getAllClients() : [];
    const firstProject = created[0];
    const projectHref = firstProject
      ? `/projects/${firstProject.slug}`
      : "/projects";

    const actions: Item[] = [
      {
        id: "a-new-project",
        label: "Create project",
        group: "Actions",
        onSelect: () => projectModal?.openCreate(),
        icon: Plus,
      },
      {
        id: "a-add-client",
        label: "Add client",
        group: "Actions",
        onSelect: () => clientModal?.openAdd(),
        icon: UserPlus,
      },
      {
        id: "a-create-invoice",
        label: "Create invoice",
        group: "Actions",
        href: firstProject
          ? `${projectHref}?tab=invoices`
          : "/projects",
        icon: FileText,
      },
      {
        id: "g-dash",
        label: "Go to Dashboard",
        group: "Navigate",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        id: "g-projects",
        label: "Go to Projects",
        group: "Navigate",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        id: "g-clients",
        label: "Go to Clients",
        group: "Navigate",
        href: "/clients",
        icon: Users,
      },
      {
        id: "g-settings",
        label: "Go to Settings",
        group: "Navigate",
        href: "/settings",
        icon: Settings,
      },
      {
        id: "g-settings-profile",
        label: "Go to Profile Settings",
        group: "Navigate",
        href: "/settings/profile",
        icon: Settings,
      },
      {
        id: "g-settings-workspace",
        label: "Go to Workspace Settings",
        group: "Navigate",
        href: "/settings/workspace",
        icon: Settings,
      },
      {
        id: "g-settings-portal",
        label: "Go to Client Portal Settings",
        group: "Navigate",
        href: "/settings/client-portal",
        icon: Settings,
      },
      {
        id: "g-settings-preferences",
        label: "Go to Preferences",
        group: "Navigate",
        href: "/settings/preferences",
        icon: Settings,
      },
      {
        id: "g-billing",
        label: "Go to Billing",
        group: "Navigate",
        href: "/billing",
        icon: CreditCard,
      },
    ];

    const projects: Item[] = created.map((p) => ({
      id: `p-${p.id}`,
      label: p.name,
      group: "Projects",
      href: `/projects/${p.slug}`,
      icon: FolderKanban,
      keywords: p.clientName,
    }));

    const clientItems: Item[] = clients.map((c) => ({
      id: `c-${c.id}`,
      label: c.name,
      group: "Clients",
      href: `/clients/${c.id}`,
      icon: Users,
      keywords: `${c.email} ${c.company ?? ""}`,
    }));

    const files: Item[] = firstProject
      ? [
          {
            id: "f-files",
            label: "Project files",
            group: "Files",
            href: `${projectHref}?tab=files`,
            icon: FileText,
            keywords: "documents uploads",
          },
        ]
      : [];

    const invoices: Item[] = firstProject
      ? [
          {
            id: "i-invoices",
            label: "Invoices",
            group: "Invoices",
            href: `${projectHref}?tab=invoices`,
            icon: CreditCard,
            keywords: "billing payment",
          },
        ]
      : [];

    const messages: Item[] = firstProject
      ? [
          {
            id: "m-messages",
            label: "Messages",
            group: "Messages",
            href: `${projectHref}?tab=messages`,
            icon: MessageSquare,
            keywords: "chat client",
          },
        ]
      : [];

    return [
      ...actions,
      ...projects,
      ...clientItems,
      ...files,
      ...invoices,
      ...messages,
    ];
  }, [open, projectModal, clientModal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        (item.keywords?.toLowerCase().includes(q) ?? false),
    );
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (item: Item) => {
    onClose();
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    if (!item.href) return;
    router.push(item.href);
  };

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const visible = hasQuery
    ? filtered
    : filtered.filter(
        (item) => item.group === "Actions" || item.group === "Navigate",
      );

  const groups = [
    "Actions",
    "Navigate",
    "Projects",
    "Clients",
    "Files",
    "Invoices",
    "Messages",
  ] as const;

  return (
    <div className="fixed inset-0 z-[180] flex items-start justify-center px-4 pt-[14vh]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 animate-popup-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[var(--shadow-popover)] animate-popup-panel"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-[18px] shrink-0 text-muted" strokeWidth={1.75} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, visible.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && visible[active]) {
                e.preventDefault();
                go(visible[active]);
              }
            }}
            placeholder="Search projects, clients, files..."
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted-soft"
          />
        </div>

        <div className="max-h-[min(52vh,380px)] overflow-y-auto overscroll-contain p-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-[10px] bg-surface text-muted">
                <Search className="size-4" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-ink">No results</p>
              <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted">
                Try another project, client, or file name.
              </p>
            </div>
          ) : (
            groups.map((group) => {
              const groupItems = visible.filter((i) => i.group === group);
              if (groupItems.length === 0) return null;
              return (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium text-muted-soft">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {groupItems.map((item) => {
                      const index = visible.indexOf(item);
                      const selected = index === active;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActive(index)}
                            onClick={() => go(item)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors ${
                              selected
                                ? "bg-ink text-white"
                                : "text-ink hover:bg-surface-hover"
                            }`}
                          >
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] ${
                                selected ? "bg-white/12" : "bg-surface"
                              }`}
                            >
                              <item.icon
                                className={`size-4 ${selected ? "text-white" : "text-muted"}`}
                                strokeWidth={1.75}
                              />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {item.label}
                            </span>
                            {item.keywords ? (
                              <span
                                className={`hidden max-w-[140px] truncate text-xs sm:inline ${
                                  selected ? "text-white/55" : "text-muted-soft"
                                }`}
                              >
                                {item.keywords}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface/50 px-3.5 py-2">
          <div className="flex items-center gap-3 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="ml-0.5">Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span className="ml-0.5">Open</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Kbd>esc</Kbd>
            <span className="ml-0.5">Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border bg-card px-1 font-sans text-[10px] font-medium text-muted">
      {children}
    </kbd>
  );
}
