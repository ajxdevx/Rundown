"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { activeProjects } from "@/data/dashboardMock";
import { projectDetail } from "@/data/projectDetailMock";
import { getAllClients } from "@/lib/clientsStore";
import { getCreatedProjects } from "@/lib/createProject";
import { useBilling } from "@/lib/billingStore";
import { mockSignOut } from "@/lib/mockAuth";
import { useUnreadBadge } from "@/lib/notificationsStore";
import AccountMenu from "./AccountMenu";
import { Avatar } from "./ui/Avatar";
import { useAuth } from "./AuthProvider";

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
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] font-semibold text-card">
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
            className={`size-3.5 transition-transform duration-150 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
            strokeWidth={2}
          />
        </button>
      </div>
      {open ? (
        <div className="ml-4 mt-0.5 flex flex-col border-l border-border pl-2.5">
          <div className="scrollbar-hide max-h-[132px] space-y-0.5 overflow-y-auto overscroll-contain">
            {list}
          </div>
          <div className="shrink-0 space-y-0.5">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative px-3 pb-3" ref={ref}>
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
        Workspace
      </p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] border border-border bg-card px-2.5 py-2 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-surface-strong text-[11px] font-semibold text-ink">
          AS
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">
            Acme Studio
          </span>
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-muted"
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-3 right-3 z-50 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] bg-accent-soft px-2.5 py-2 text-left text-sm font-medium text-ink"
            >
              <span className="flex size-7 items-center justify-center rounded-[6px] bg-ink text-[10px] font-semibold text-card">
                AS
              </span>
              Acme Studio
            </button>
          </li>
          <li>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-sm text-muted hover-soft"
            >
              <span className="flex size-7 items-center justify-center rounded-[6px] bg-surface text-[10px] font-semibold text-ink">
                +
              </span>
              Add workspace
            </button>
          </li>
        </ul>
      ) : null}
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
const SIDEBAR_LIST_LIMIT = 3;

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user } = useAuth();
  const unreadCount = useUnreadBadge();
  const { isPro } = useBilling();

  const [projectsOpen, setProjectsOpen] = useState(() => {
    const stored = readExpandState(pathname);
    return stored.projects || pathname.startsWith("/projects");
  });
  const [clientsOpen, setClientsOpen] = useState(() => {
    const stored = readExpandState(pathname);
    return stored.clients || pathname.startsWith("/clients");
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [navProjects, setNavProjects] = useState<
    { name: string; slug: string }[]
  >([]);
  const [navClients, setNavClients] = useState<
    { id: string; name: string }[]
  >([]);

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

  useEffect(() => {
    const created = getCreatedProjects();
    const list = [
      ...created.map((p) => ({ name: p.name, slug: p.slug })),
      { name: projectDetail.name, slug: projectDetail.slug },
      ...activeProjects.map((p) => ({ name: p.name, slug: p.slug })),
    ];
    const seen = new Set<string>();
    const unique: { name: string; slug: string }[] = [];
    for (const item of list) {
      const key = `${item.slug}:${item.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length >= SIDEBAR_LIST_LIMIT) break;
    }
    if (unique.length < SIDEBAR_LIST_LIMIT) {
      for (const extra of [
        { name: "Brand Identity", slug: projectDetail.slug },
        { name: "Mobile App", slug: projectDetail.slug },
      ]) {
        if (unique.length >= SIDEBAR_LIST_LIMIT) break;
        if (!unique.some((u) => u.name === extra.name)) unique.push(extra);
      }
    }
    setNavProjects(unique.slice(0, SIDEBAR_LIST_LIMIT));

    const all = getAllClients();
    const curated: { id: string; name: string }[] = [];
    const c1 = all.find((c) => c.id === "c1");
    if (c1?.company) curated.push({ id: c1.id, name: c1.company });
    for (const c of all) {
      if (curated.length >= SIDEBAR_LIST_LIMIT) break;
      if (!curated.some((x) => x.id === c.id && x.name === c.name)) {
        curated.push({ id: c.id, name: c.name });
      }
    }
    setNavClients(curated.slice(0, SIDEBAR_LIST_LIMIT));
  }, [pathname]);

  const displayName =
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

  const showcaseProjects = useMemo(
    () =>
      navProjects.length > 0
        ? navProjects
        : [
            { name: "Website Redesign", slug: "acme-website-redesign" },
            { name: "Brand Identity", slug: "acme-website-redesign" },
            { name: "Mobile App", slug: "acme-website-redesign" },
          ],
    [navProjects],
  );

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-visible border-r border-border bg-background">
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
        <p className="mb-1.5 shrink-0 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
          Main
        </p>

        <div className="flex shrink-0 flex-col gap-0.5">
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
            list={showcaseProjects.map((p) => (
              <NestedLink
                key={`${p.slug}-${p.name}`}
                href={`/projects/${p.slug}`}
                label={p.name}
                active={pathname.includes(p.slug)}
              />
            ))}
            footer={
              <>
                <NestedLink href="/projects" label="View all projects" />
                <Link
                  href="/projects/new"
                  className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-hover"
                >
                  <Plus className="size-3.5" strokeWidth={2.25} />
                  New Project
                </Link>
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
            list={(navClients.length > 0
              ? navClients
              : [
                  { id: "c1", name: "Acme Studio" },
                  { id: "c1", name: "Sarah Johnson" },
                  { id: "c2", name: "John Smith" },
                ]
            ).map((c) => (
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
                <Link
                  href="/clients/new"
                  className="flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-hover"
                >
                  <Plus className="size-3.5" strokeWidth={2.25} />
                  Add Client
                </Link>
              </>
            }
          />
        </div>

        <div className="mt-5 shrink-0">
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-soft">
            Workspace
          </p>
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
            workspaceName="Alex Studio"
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
    </aside>
  );
}
