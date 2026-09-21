"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { getAllClients, CLIENTS_CHANGED } from "@/lib/clientsStore";
import { getCreatedProjects } from "@/lib/createProject";
import { useBilling } from "@/lib/billingStore";
import { mockSignOut } from "@/lib/mockAuth";
import { useUnreadBadge } from "@/lib/notificationsStore";
import { useProfileSettings } from "@/lib/settingsStore";
import {
  DEFAULT_WORKSPACE_ID,
  WORKSPACE_CHANGED,
  getActiveWorkspace,
  getActiveWorkspaceId,
  getWorkspaces,
  setActiveWorkspace,
  workspaceInitials,
} from "@/lib/workspaceStore";
import AccountMenu from "./AccountMenu";
import CreateWorkspaceModal from "./CreateWorkspaceModal";
import { Avatar } from "./ui/Avatar";
import { useAuth } from "./AuthProvider";
import { useClientModalOptional } from "./ClientModalProvider";
import { useProjectModalOptional } from "./ProjectModalProvider";

const WORKSPACE_NAV = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/billing", label: "Billing", icon: CreditCard },
] as const;

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ink/20 ${
        active
          ? "bg-accent-soft text-ink"
          : "text-muted hover:bg-surface-hover hover:text-ink"
      }`}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
          aria-hidden
        />
      ) : null}
      <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold tabular-nums text-ink"
          aria-label={`${badge > 9 ? "9 or more" : badge} unread`}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function NestedLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block truncate rounded-[6px] px-2.5 py-1.5 text-[13px] transition-colors ${
        active
          ? "bg-surface font-medium text-ink"
          : "text-muted hover:bg-surface-hover hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

function Collapsible({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}

function ExpandableSection({
  label,
  icon: Icon,
  href,
  active,
  open,
  onToggle,
  list,
  footer,
}: {
  label: string;
  icon: typeof FolderKanban;
  href: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  list: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="shrink-0">
      <div
        className={`relative flex h-9 items-center rounded-[8px] transition-colors ${
          active
            ? "bg-accent-soft text-ink"
            : "text-muted hover:bg-surface-hover hover:text-ink"
        }`}
      >
        {active ? (
          <span
            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
            aria-hidden
          />
        ) : null}
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[8px] px-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <Icon className="size-4 shrink-0 opacity-80" strokeWidth={1.75} />
          <span className="truncate">{label}</span>
        </Link>
        <button
          type="button"
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          aria-expanded={open}
          onClick={onToggle}
          className="mr-1 flex size-7 cursor-pointer items-center justify-center rounded-[6px] text-muted outline-none hover:bg-surface-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              open ? "rotate-0" : "-rotate-90"
            }`}
            strokeWidth={2}
          />
        </button>
      </div>
      <Collapsible open={open}>
        <div className="ml-4 mt-0.5 flex flex-col border-l border-border pl-2.5">
          <div className="scrollbar-hide max-h-[132px] space-y-0.5 overflow-y-auto overscroll-contain">
            {list}
          </div>
          <div className="shrink-0 space-y-0.5">{footer}</div>
        </div>
      </Collapsible>
    </div>
  );
}

function WorkspaceSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(() =>
    typeof window !== "undefined" ? getWorkspaces() : [],
  );
  const [activeId, setActiveId] = useState(() =>
    typeof window !== "undefined"
      ? getActiveWorkspaceId()
      : DEFAULT_WORKSPACE_ID,
  );
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setWorkspaces(getWorkspaces());
    setActiveId(getActiveWorkspaceId());
  };

  useEffect(() => {
    refresh();
    window.addEventListener(WORKSPACE_CHANGED, refresh);
    return () => window.removeEventListener(WORKSPACE_CHANGED, refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  const switchTo = (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setActiveWorkspace(id);
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative px-3 pb-3" ref={ref}>
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
        Workspace
      </p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch workspace"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] border border-border bg-card px-2.5 py-2 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-surface-strong text-[11px] font-semibold text-ink">
          {active?.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={active.logoDataUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            workspaceInitials(active?.name ?? "WS")
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            {active?.name ?? "Workspace"}
          </span>
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-muted"
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Workspaces"
          className="absolute left-3 right-3 z-50 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
        >
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {workspaces.map((ws) => {
              const selected = ws.id === activeId;
              return (
                <li key={ws.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => switchTo(ws.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                      selected
                        ? "bg-accent-soft font-medium text-ink"
                        : "text-muted hover-soft hover:text-ink"
                    }`}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-surface text-[10px] font-semibold text-ink">
                      {ws.logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ws.logoDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        workspaceInitials(ws.name)
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{ws.name}</span>
                    {selected ? (
                      <Check
                        className="size-3.5 shrink-0 text-ink"
                        strokeWidth={2.25}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 border-t border-border pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm font-medium text-ink hover-soft"
            >
              <span className="flex size-7 items-center justify-center rounded-[6px] bg-surface text-ink">
                <Plus className="size-3.5" strokeWidth={2.25} />
              </span>
              Create Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/settings/workspace");
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm font-medium text-ink hover-soft"
            >
              <span className="flex size-7 items-center justify-center rounded-[6px] bg-surface text-ink">
                <Settings className="size-3.5" strokeWidth={1.75} />
              </span>
              Workspace Settings
            </button>
          </div>
        </div>
      ) : null}
      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}

function UpgradeCard() {
  return (
    <div className="mb-2 rounded-[10px] border border-accent bg-accent px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Zap className="mt-0.5 size-3.5 shrink-0 text-ink" strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink">Upgrade to Pro</p>
          <p className="mt-0.5 text-[11px] leading-snug text-ink/70">
            Unlock more projects, clients &amp; features
          </p>
        </div>
      </div>
      <Link
        href="/billing"
        className="mt-2.5 flex h-7 w-full cursor-pointer items-center justify-center rounded-[7px] bg-ink text-[11px] font-semibold text-white outline-none transition-colors hover:bg-ink/90 focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        Upgrade →
      </Link>
    </div>
  );
}


const NAV_EXPAND_KEY = "dueso:nav-expand";
const CATEGORY_EXPAND_KEY = "dueso:nav-categories";
const SIDEBAR_WIDTH_KEY = "dueso:sidebar-width";
const SIDEBAR_LIST_LIMIT = 3;
const SIDEBAR_DEFAULT_WIDTH = 248;
const SIDEBAR_MIN_WIDTH = SIDEBAR_DEFAULT_WIDTH;
const SIDEBAR_MAX_WIDTH = 400;

function readExpandState(pathname: string) {
  const defaults = {
    projects: pathname.startsWith("/projects"),
    clients: pathname.startsWith("/clients"),
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = sessionStorage.getItem(NAV_EXPAND_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as {
      projects?: boolean;
      clients?: boolean;
    };
    return {
      projects: parsed.projects ?? defaults.projects,
      clients: parsed.clients ?? defaults.clients,
    };
  } catch {
    return defaults;
  }
}

function writeExpandState(next: { projects: boolean; clients: boolean }) {
  try {
    sessionStorage.setItem(NAV_EXPAND_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function readCategoryState() {
  const defaults = { main: true, workspace: true };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = sessionStorage.getItem(CATEGORY_EXPAND_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as { main?: boolean; workspace?: boolean };
    return {
      main: parsed.main ?? defaults.main,
      workspace: parsed.workspace ?? defaults.workspace,
    };
  } catch {
    return defaults;
  }
}

function writeCategoryState(next: { main: boolean; workspace: boolean }) {
  try {
    sessionStorage.setItem(CATEGORY_EXPAND_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function readSidebarWidth() {
  if (typeof window === "undefined") return SIDEBAR_DEFAULT_WIDTH;
  try {
    const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (!raw) return SIDEBAR_DEFAULT_WIDTH;
    const n = Number(raw);
    if (!Number.isFinite(n)) return SIDEBAR_DEFAULT_WIDTH;
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, n));
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeSidebarWidth(width: number) {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  } catch {
    /* ignore */
  }
}

function CategoryHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      onClick={onToggle}
      className="mb-1.5 flex w-fit max-w-full cursor-pointer items-center gap-1 rounded-[6px] px-2.5 py-0.5 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
        {label}
      </span>
      <ChevronDown
        className={`size-3.5 shrink-0 text-muted-soft transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          open ? "rotate-0" : "-rotate-90"
        }`}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const projectModal = useProjectModalOptional();
  const clientModal = useClientModalOptional();
  const router = useRouter();
  const { profile, user } = useAuth();
  const unreadCount = useUnreadBadge();
  const { isPro } = useBilling();
  const profileSettings = useProfileSettings();

  const [projectsOpen, setProjectsOpen] = useState(() =>
    pathname.startsWith("/projects"),
  );
  const [clientsOpen, setClientsOpen] = useState(() =>
    pathname.startsWith("/clients"),
  );
  const [mainOpen, setMainOpen] = useState(true);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [navProjects, setNavProjects] = useState<
    { name: string; slug: string }[]
  >([]);
  const [navClients, setNavClients] = useState<
    { id: string; name: string }[]
  >([]);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  useEffect(() => {
    const cats = readCategoryState();
    setMainOpen(cats.main);
    setWorkspaceOpen(cats.workspace);
    setSidebarWidth(readSidebarWidth());
  }, []);

  useEffect(() => {
    const stored = readExpandState(pathname);
    setProjectsOpen(stored.projects || pathname.startsWith("/projects"));
    setClientsOpen(stored.clients || pathname.startsWith("/clients"));
  }, [pathname]);
  useEffect(() => {
    const onProjects = pathname.startsWith("/projects");
    const onClients = pathname.startsWith("/clients");
    if (onProjects) setProjectsOpen(true);
    if (onClients) setClientsOpen(true);
  }, [pathname]);

  const toggleProjects = () => {
    setProjectsOpen((v) => {
      const next = !v;
      writeExpandState({ projects: next, clients: clientsOpen });
      return next;
    });
  };

  const toggleClients = () => {
    setClientsOpen((v) => {
      const next = !v;
      writeExpandState({ projects: projectsOpen, clients: next });
      return next;
    });
  };

  const toggleMain = () => {
    setMainOpen((v) => {
      const next = !v;
      writeCategoryState({ main: next, workspace: workspaceOpen });
      return next;
    });
  };

  const toggleWorkspace = () => {
    setWorkspaceOpen((v) => {
      const next = !v;
      writeCategoryState({ main: mainOpen, workspace: next });
      return next;
    });
  };

  const onResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
      setResizing(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [sidebarWidth],
  );

  const onResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!resizeRef.current) return;
      const delta = e.clientX - resizeRef.current.startX;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, resizeRef.current.startWidth + delta),
      );
      setSidebarWidth(next);
    },
    [],
  );

  const onResizePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!resizeRef.current) return;
      const delta = e.clientX - resizeRef.current.startX;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, resizeRef.current.startWidth + delta),
      );
      resizeRef.current = null;
      setResizing(false);
      setSidebarWidth(next);
      writeSidebarWidth(next);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  useEffect(() => {
    if (!resizing) return;
    const prev = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = prev;
      document.body.style.userSelect = prevSelect;
    };
  }, [resizing]);

  useEffect(() => {
    const refreshNav = () => {
      const created = getCreatedProjects();
      const unique: { name: string; slug: string }[] = [];
      for (const p of created) {
        if (!p.slug) continue;
        unique.push({ name: p.name, slug: p.slug });
        if (unique.length >= SIDEBAR_LIST_LIMIT) break;
      }
      setNavProjects(unique);

      const curated: { id: string; name: string }[] = [];
      for (const c of getAllClients()) {
        if (curated.length >= SIDEBAR_LIST_LIMIT) break;
        curated.push({
          id: c.id,
          name: c.company?.trim() || c.name,
        });
      }
      setNavClients(curated);
    };

    refreshNav();
    window.addEventListener(CLIENTS_CHANGED, refreshNav);
    window.addEventListener("dueso:projects-changed", refreshNav);
    window.addEventListener(WORKSPACE_CHANGED, refreshNav);
    return () => {
      window.removeEventListener(CLIENTS_CHANGED, refreshNav);
      window.removeEventListener("dueso:projects-changed", refreshNav);
      window.removeEventListener(WORKSPACE_CHANGED, refreshNav);
    };
  }, [pathname]);

  const [wsName, setWsName] = useState("Acme Studio");

  useEffect(() => {
    const sync = () => setWsName(getActiveWorkspace().name);
    sync();
    window.addEventListener(WORKSPACE_CHANGED, sync);
    return () => window.removeEventListener(WORKSPACE_CHANGED, sync);
  }, []);

  const displayName =
    profileSettings.fullName ||
    profile?.display_name ||
    profile?.username ||
    (user?.user_metadata?.full_name as string | undefined) ||
    "Alex Johnson";

  const firstName = displayName.trim().split(/\s+/)[0] || "Alex";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const projectActive = isActive("/projects");
  const clientActive = isActive("/clients");

  const projectPathMatch = (slug: string) => {
    const base = `/projects/${slug}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col overflow-visible border-r border-border bg-background"
      style={{ width: sidebarWidth }}
    >
      <div className="shrink-0 border-b border-border pt-3">
        <Link
          href="/"
          className="mb-3 flex items-center gap-2.5 px-5"
          aria-label="Dueso home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
            priority
            unoptimized
          />
          <span className="text-[16px] font-semibold tracking-tight text-ink">
            Dueso
          </span>
        </Link>
        <WorkspaceSwitcher />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3">
        <div className="shrink-0">
          <CategoryHeader label="Main" open={mainOpen} onToggle={toggleMain} />
          <Collapsible open={mainOpen}>
            <div className="flex flex-col gap-0.5">
              <NavItem
                href="/"
                label="Dashboard"
                icon={LayoutDashboard}
                active={isActive("/")}
              />

              <ExpandableSection
                label="Projects"
                icon={FolderKanban}
                href="/projects"
                active={projectActive}
                open={projectsOpen}
                onToggle={toggleProjects}
                list={navProjects.map((p) => (
                  <NestedLink
                    key={p.slug}
                    href={`/projects/${p.slug}`}
                    label={p.name}
                    active={projectPathMatch(p.slug)}
                  />
                ))}
                footer={
                  <>
                    <NestedLink href="/projects" label="View all projects" />
                    <button
                      type="button"
                      onClick={() => projectModal?.openCreate()}
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] font-medium text-ink hover:bg-surface-hover"
                    >
                      <Plus className="size-3.5" strokeWidth={2.25} />
                      New Project
                    </button>
                  </>
                }
              />

              <ExpandableSection
                label="Clients"
                icon={Users}
                href="/clients"
                active={clientActive}
                open={clientsOpen}
                onToggle={toggleClients}
                list={navClients.map((c) => (
                  <NestedLink
                    key={`${c.id}-${c.name}`}
                    href={`/clients/${c.id}`}
                    label={c.name}
                    active={pathname === `/clients/${c.id}`}
                  />
                ))}
                footer={
                  <>
                    <NestedLink href="/clients" label="View all clients" />
                    <button
                      type="button"
                      onClick={() => clientModal?.openAdd()}
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] font-medium text-ink hover:bg-surface-hover"
                    >
                      <Plus className="size-3.5" strokeWidth={2.25} />
                      Add Client
                    </button>
                  </>
                }
              />
            </div>
          </Collapsible>
        </div>

        <div className="mt-1.5 shrink-0">
          <CategoryHeader
            label="Workspace"
            open={workspaceOpen}
            onToggle={toggleWorkspace}
          />
          <Collapsible open={workspaceOpen}>
            <div className="flex flex-col gap-0.5">
              {WORKSPACE_NAV.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  badge={
                    item.href === "/notifications" ? unreadCount : undefined
                  }
                />
              ))}
            </div>
          </Collapsible>
        </div>
      </nav>

      <div className="relative z-50 shrink-0 border-t border-border p-3">
        {isPro ? (
          <div className="mb-2 flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-xs font-semibold text-muted">
            <Sparkles className="size-3.5 text-ink" strokeWidth={1.75} />
            <span className="tracking-wide text-ink">PRO PLAN</span>
          </div>
        ) : (
          <UpgradeCard />
        )}

        <div className="relative mt-0.5">
          <AccountMenu
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            displayName={displayName}
            workspaceName={wsName}
          />
          <div
            className={`group flex w-full items-center gap-1 rounded-[8px] px-1.5 py-1.5 transition-colors ${
              accountOpen
                ? "bg-surface"
                : "hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent"
            }`}
          >
            <button
              id="account-menu-trigger"
              type="button"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => setAccountOpen((v) => !v)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[6px] px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <Avatar name={displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {firstName}
                </p>
                <p className="truncate text-xs text-muted-soft">Personal</p>
              </div>
            </button>
            <button
              type="button"
              aria-label="Log out"
              data-hover-stop
              onClick={() => {
                setAccountOpen(false);
                mockSignOut();
                router.push("/login");
              }}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted outline-none transition-colors hover:bg-danger-soft hover:text-danger focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <LogOut className="size-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Resize sidebar"
        title="Drag to resize · double-click to reset"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        onDoubleClick={() => {
          setSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
          writeSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
        }}
        className="group/resize absolute inset-y-0 -right-2 z-50 flex w-4 cursor-col-resize items-center justify-center outline-none"
      >
        <span
          className={`flex h-8 w-3.5 items-center justify-center rounded-[6px] border border-border bg-card shadow-sm transition-colors ${
            resizing
              ? "border-accent bg-accent-soft"
              : "opacity-70 group-hover/resize:opacity-100 group-focus-visible/resize:opacity-100"
          }`}
        >
          <GripVertical
            className={`size-3.5 ${resizing ? "text-ink" : "text-muted"}`}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </button>
    </aside>
  );
}
