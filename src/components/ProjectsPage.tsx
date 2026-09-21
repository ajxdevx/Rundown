"use client";

import {
  Archive,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CirclePause,
  Copy,
  CopyPlus,
  FolderKanban,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PlanLimitModal,
  UpgradeCheckout,
} from "@/components/billing/BillingModals";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import ContextMenu from "@/components/ContextMenu";
import DashboardTopBar from "@/components/DashboardTopBar";
import EmptyState from "@/components/EmptyState";
import MenuDropdown from "@/components/MenuDropdown";
import { ProjectsPageSkeleton } from "@/components/skeletons";
import { useToastOptional } from "@/components/ToastProvider";
import { useProjectModal } from "@/components/ProjectModalProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AppCheckbox } from "@/components/ui/AppCheckbox";
import {
  paymentStatusIcon,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  StatusBadge,
} from "@/components/ui/StatusBadge";
import ProjectCard from "@/components/ProjectCard";
import {
  type ActiveProject,
  type PaymentStatus,
  type ProjectStatus,
} from "@/data/dashboardMock";
import { applySeedFinance } from "@/data/seedWorkspace";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { useBilling } from "@/lib/billingStore";
import {
  getCreatedProjects,
  getCreatedProjectById,
  getCreatedProjectBySlug,
  commitCreatedProject,
  type CreatedProject,
} from "@/lib/createProject";
import { deadlineLabelFromIso, deadlineToneSurface } from "@/lib/deadlineLabel";
import {
  parseProjectsViewMode,
  PROJECTS_FILTER_WIDTHS,
  PROJECTS_VIEW_COOKIE,
  PROJECTS_VIEW_KEY,
  type ProjectsViewMode,
} from "@/lib/projectsView";
import { getActiveWorkspaceId } from "@/lib/workspaceStore";
import { backgroundSync } from "@/lib/optimistic";
import { markSlugTaken, uniqueProjectSlug } from "@/lib/projectSlug";

type FilterKey =
  | "all"
  | "active"
  | "draft"
  | "on-hold"
  | "completed"
  | "archived";

type SortKey =
  | "updated"
  | "deadline"
  | "created"
  | "name-asc"
  | "name-desc"
  | "value-desc"
  | "value-asc";

type PaymentFilter = "paid" | "due" | "overdue" | "processing" | "failed";

type ViewMode = ProjectsViewMode;

/** Shared list table tracks — same data fields as grid ProjectCard. */
const LIST_COLS =
  "lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_9rem_6.5rem_6.5rem_4.75rem_4.75rem_5.25rem_4.5rem_14.5rem]";

function readViewMode(): ViewMode {
  if (typeof window === "undefined") return "grid";
  const stored = window.localStorage.getItem(PROJECTS_VIEW_KEY);
  if (stored === "list" || stored === "grid") return stored;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PROJECTS_VIEW_COOKIE}=(list|grid)`),
  );
  return parseProjectsViewMode(match?.[1]);
}

function persistViewMode(mode: ViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECTS_VIEW_KEY, mode);
  document.cookie = `${PROJECTS_VIEW_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

type ListProject = {
  id: string;
  slug: string;
  name: string;
  client: string;
  progress: number;
  currentTask: string;
  deadlineAt: string;
  deadlineLabel: string;
  value: number;
  paid: number;
  paymentStatus: PaymentStatus;
  status: ProjectStatus;
  updatedAt: string;
  createdAt: string;
  source: "seed" | "created";
};

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "on-hold", label: "On Hold" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "updated", label: "Recently updated" },
  { id: "deadline", label: "Deadline soonest" },
  { id: "created", label: "Recently created" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "value-desc", label: "Highest value" },
  { id: "value-asc", label: "Lowest value" },
];

const PAYMENT_CHOICES: { id: PaymentFilter; label: string }[] = [
  { id: "paid", label: "Paid" },
  { id: "due", label: "Unpaid" },
  { id: "overdue", label: "Overdue" },
  { id: "processing", label: "Processing" },
  { id: "failed", label: "Failed" },
];

function toggleChoice<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyToneClass(status?: string | null) {
  switch (status) {
    case "paid":
    case "collected":
      return "text-success";
    case "due":
    case "pending":
    case "partial":
    case "outstanding":
      return "text-warning";
    case "overdue":
    case "failed":
      return "text-danger";
    case "processing":
    case "sent":
      return "text-info";
    default:
      return "text-ink";
  }
}

function paymentLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "due":
    case "pending":
    case "partial":
      return "Unpaid";
    case "overdue":
      return "Past due";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
  }
}

function projectLabel(status: ProjectStatus) {
  switch (status) {
    case "active":
    case "review":
      return "Active";
    case "draft":
      return "Draft";
    case "on-hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
  }
}

function normalizePayment(status: PaymentStatus): PaymentFilter | "other" {
  if (status === "partial" || status === "pending") return "due";
  if (
    status === "paid" ||
    status === "due" ||
    status === "overdue" ||
    status === "processing" ||
    status === "failed"
  ) {
    return status;
  }
  return "other";
}

const chipClass = (active: boolean) =>
  `h-8 cursor-pointer rounded-[8px] px-3 text-xs font-medium transition-colors ${
    active
      ? "bg-accent text-ink"
      : "text-muted hover:bg-bg-hover hover:text-ink"
  }`;

function createdToList(p: CreatedProject): ListProject {
  const done = p.tasks.filter((t) => t.done).length;
  const total = p.tasks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const currentTask =
    p.tasks.find((t) => !t.done)?.name ||
    (total > 0 ? "All tasks complete" : "No tasks yet");
  return applySeedFinance({
    id: p.id,
    slug: p.slug,
    name: p.name,
    client: p.clientName,
    progress,
    currentTask,
    deadlineAt: p.deadline || "",
    deadlineLabel: p.deadline
      ? deadlineLabelFromIso(p.deadline)
      : "No deadline",
    value: p.value ?? 0,
    paid: 0,
    paymentStatus: "due",
    status: p.status,
    updatedAt: p.updatedAt || p.createdAt,
    createdAt: p.createdAt,
    source: "created" as const,
  });
}

function buildInitialProjects(): ListProject[] {
  const created = typeof window !== "undefined" ? getCreatedProjects() : [];
  return created.map(createdToList);
}

function ProjectRowMenu({
  open,
  onClose,
  onAction,
  position,
  showComplete,
}: {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
  position?: { x: number; y: number } | null;
  showComplete: boolean;
}) {
  return (
    <ContextMenu
      open={open}
      onClose={onClose}
      onAction={onAction}
      position={position}
      clampHeight={320}
      items={[
        { id: "open", label: "Open Project", icon: FolderKanban },
        { id: "edit", label: "Edit Project", icon: Pencil },
        { id: "duplicate", label: "Duplicate Project", icon: CopyPlus },
        { id: "copy", label: "Copy Portal Link", icon: Copy },
        {
          id: "complete",
          label: "Mark as Completed",
          icon: CheckCircle2,
          hidden: !showComplete,
        },
        {
          id: "archive",
          label: "Archive Project",
          icon: Archive,
          dividerBefore: true,
        },
        { id: "delete", label: "Delete Project", icon: Trash2, danger: true },
      ]}
    />
  );
}

function MultiSelectDropdown({
  allLabel,
  widthLabel,
  options,
  selected,
  onChange,
  menuWidthClass = "w-52",
}: {
  allLabel: string;
  widthLabel: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  menuWidthClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const buttonLabel = useMemo(() => {
    if (selected.length === 0) return allLabel;
    if (selected.length === 1) {
      return (
        options.find((o) => o.id === selected[0])?.label ?? selected[0]
      );
    }
    return `${selected.length} selected`;
  }, [allLabel, options, selected]);

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

  const OptionRow = ({
    label,
    active,
    onSelect,
  }: {
    label: string;
    active: boolean;
    onSelect: () => void;
  }) => (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onSelect}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm text-ink hover-soft"
      >
        <AppCheckbox checked={active} size="sm" />
        <span className="min-w-0 truncate font-medium">{label}</span>
      </button>
    </li>
  );

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-sm font-medium text-muted hover:text-ink"
      >
        <span className="inline-grid text-left">
          <span
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
            aria-hidden
          >
            {widthLabel}
          </span>
          <span className="col-start-1 row-start-1 truncate whitespace-nowrap">
            {buttonLabel}
          </span>
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 opacity-70"
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-multiselectable
          className={`absolute right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)] ${menuWidthClass}`}
        >
          <OptionRow
            label={allLabel}
            active={selected.length === 0}
            onSelect={() => onChange([])}
          />
          {options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <OptionRow
                key={opt.id}
                label={opt.label}
                active={active}
                onSelect={() => onChange(toggleChoice(selected, opt.id))}
              />
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function ProjectsPage({
  initialViewMode = "grid",
}: {
  initialViewMode?: ViewMode;
}) {
  const router = useRouter();
  const { openCreate, openEdit } = useProjectModal();
  const toast = useToastOptional();
  const loading = useInitialLoading(420);
  const { canCreateProject, upgradeToPro } = useBilling();

  const [projects, setProjects] = useState<ListProject[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilter[]>([]);
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("updated");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ListProject | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  useEffect(() => {
    const stored = readViewMode();
    setViewMode(stored);
    persistViewMode(stored);
  }, []);

  const setView = (mode: ViewMode) => {
    setViewMode(mode);
    persistViewMode(mode);
  };

  useEffect(() => {
    const load = () => {
      try {
        setProjects(buildInitialProjects());
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    };
    load();
    window.addEventListener("dueso:projects-changed", load);
    window.addEventListener("dueso:workspace-changed", load);
    return () => {
      window.removeEventListener("dueso:projects-changed", load);
      window.removeEventListener("dueso:workspace-changed", load);
    };
  }, []);

  const closeMenu = () => {
    setMenuId(null);
    setMenuPos(null);
  };

  const clients = useMemo(() => {
    const names = new Set(projects.map((p) => p.client).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...projects];

    if (filter !== "all") {
      list = list.filter((p) => {
        if (filter === "active")
          return p.status === "active" || p.status === "review";
        return p.status === filter;
      });
    }

    if (paymentFilters.length > 0) {
      list = list.filter((p) => {
        const key = normalizePayment(p.paymentStatus);
        return key !== "other" && paymentFilters.includes(key);
      });
    }

    if (clientFilters.length > 0) {
      list = list.filter((p) => clientFilters.includes(p.client));
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sort === "name-asc") cmp = a.name.localeCompare(b.name);
      else if (sort === "name-desc") cmp = b.name.localeCompare(a.name);
      else if (sort === "value-desc") cmp = b.value - a.value;
      else if (sort === "value-asc") cmp = a.value - b.value;
      else if (sort === "deadline")
        cmp = (a.deadlineAt || "9999").localeCompare(b.deadlineAt || "9999");
      else if (sort === "created")
        cmp = b.createdAt.localeCompare(a.createdAt);
      else cmp = b.updatedAt.localeCompare(a.updatedAt);
      if (cmp !== 0) return cmp;
      return a.id.localeCompare(b.id);
    });

    return list;
  }, [projects, filter, paymentFilters, clientFilters, query, sort]);

  const hasAnyProjects = projects.length > 0;
  const hasActiveFilters =
    filter !== "all" ||
    paymentFilters.length > 0 ||
    clientFilters.length > 0 ||
    query.trim().length > 0;

  const clearFilters = () => {
    setQuery("");
    setFilter("all");
    setPaymentFilters([]);
    setClientFilters([]);
  };

  const openNewProject = () => {
    if (!canCreateProject) {
      setLimitOpen(true);
      return;
    }
    openCreate();
  };

  const copyPortalLink = async (project: ListProject) => {
    const link = `${window.location.origin}/p/${project.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      toast?.success("Portal link copied");
    } catch {
      toast?.error("Couldn't copy the portal link.");
    }
  };

  const archiveProject = (project: ListProject) => {
    const prev = projects;
    setProjects((list) =>
      list.map((p) =>
        p.id === project.id ? { ...p, status: "archived" as const } : p,
      ),
    );
    toast?.undo("Project archived", () => setProjects(prev));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't update the project. Try again.");
      }
    });
  };

  const completeProject = (project: ListProject) => {
    const prev = projects;
    setProjects((list) =>
      list.map((p) =>
        p.id === project.id
          ? {
              ...p,
              status: "completed" as const,
              progress: 100,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't update the project. Try again.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const prev = projects;
    setProjects((list) => list.filter((p) => p.id !== target.id));
    toast?.undo("Project deleted", () => setProjects(prev));
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't delete the project. Try again.");
      }
    });
  };

  const duplicateProject = (project: ListProject) => {
    if (!canCreateProject) {
      setLimitOpen(true);
      return;
    }
    const taken = projects.map((p) => p.slug);
    const slug = uniqueProjectSlug(`${project.name} Copy`, taken);
    markSlugTaken(slug);
    const now = new Date().toISOString();
    const dup: ListProject = {
      ...project,
      id: `proj_${Date.now()}`,
      slug,
      name: `${project.name} (Copy)`,
      paid: 0,
      paymentStatus: "due",
      status: "draft",
      progress: 0,
      currentTask: project.currentTask,
      createdAt: now,
      updatedAt: now,
      source: "created",
    };

    const created: CreatedProject = {
      id: dup.id,
      workspaceId: getActiveWorkspaceId(),
      slug: dup.slug,
      name: dup.name,
      clientId: null,
      clientName: dup.client,
      clientEmail: "",
      description: "",
      value: dup.value || null,
      currency: "USD",
      deadline: dup.deadlineAt,
      status: "draft",
      tasks: [],
      createdAt: now,
      portalPath: `/p/${dup.slug}`,
    };

    const prev = projects;
    setProjects((list) => [dup, ...list]);
    try {
      commitCreatedProject(created);
    } catch {
      /* local only */
    }
    void backgroundSync().then((r) => {
      if (!r.ok) {
        setProjects(prev);
        toast?.error("Couldn't duplicate the project. Try again.");
      } else {
        toast?.success("Project duplicated");
      }
    });
  };

  const onMenuAction = (project: ListProject, action: string) => {
    if (action === "open") {
      router.push(`/projects/${project.slug}`);
      return;
    }
    if (action === "edit") {
      const created =
        project.source === "created"
          ? getCreatedProjectById(project.id) ||
            getCreatedProjectBySlug(project.slug)
          : null;
      openEdit({
        initial: {
          id: project.id,
          name: project.name,
          clientId: created?.clientId ?? null,
          clientName: created?.clientName ?? project.client,
          clientEmail: created?.clientEmail ?? "",
          description: created?.description ?? "",
          value: created?.value ?? project.value,
          currency: created?.currency ?? "USD",
          deadline: created?.deadline ?? "",
          status: (created?.status ?? project.status) as
            | "active"
            | "draft"
            | "on-hold"
            | "completed"
            | "archived",
          tasks: created?.tasks ?? [],
        },
        onSuccess: (values) => {
          setProjects((list) =>
            list.map((p) =>
              p.id === project.id
                ? {
                    ...p,
                    name: values.name,
                    client: values.clientName,
                    value: values.value ?? 0,
                    status: values.status,
                    deadlineAt: values.deadline || p.deadlineAt,
                    deadlineLabel: values.deadline
                      ? deadlineLabelFromIso(values.deadline)
                      : "No deadline",
                    progress:
                      values.tasks.length === 0
                        ? 0
                        : Math.round(
                            (values.tasks.filter((t) => t.done).length /
                              values.tasks.length) *
                              100,
                          ),
                  }
                : p,
            ),
          );
        },
      });
      return;
    }
    if (action === "copy") {
      void copyPortalLink(project);
      return;
    }
    if (action === "duplicate") {
      duplicateProject(project);
      return;
    }
    if (action === "complete") {
      completeProject(project);
      return;
    }
    if (action === "archive") {
      archiveProject(project);
      return;
    }
    if (action === "delete") {
      setDeleteTarget(project);
    }
  };

  const retryLoad = () => {
    try {
      setProjects(buildInitialProjects());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  };

  const emptyTitle = (() => {
    if (!hasAnyProjects) return null;
    if (query.trim() && filtered.length === 0) return "No projects found";
    if (filter !== "all" && filtered.length === 0) {
      const label =
        FILTERS.find((f) => f.id === filter)?.label.toLowerCase() ?? "matching";
      return `No ${label} projects`;
    }
    if (filtered.length === 0) return "No projects found";
    return null;
  })();

  const emptyDescription = (() => {
    if (query.trim()) return "Try adjusting your search or filters.";
    switch (filter) {
      case "active":
        return "Active projects will show up here once you start one.";
      case "draft":
        return "Drafts you save will appear here until you’re ready to start.";
      case "on-hold":
        return "Paused projects will appear here when you put one on hold.";
      case "completed":
        return "Finished projects will land here when you mark them complete.";
      case "archived":
        return "Archived projects will appear here.";
      default:
        return "Projects matching this filter will appear here.";
    }
  })();

  const emptyIcon = (() => {
    switch (filter) {
      case "on-hold":
        return CirclePause;
      case "completed":
        return CircleCheck;
      case "archived":
        return Archive;
      case "draft":
        return CircleDashed;
      default:
        return FolderKanban;
    }
  })();

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar />

      {loading ? (
        <ProjectsPageSkeleton viewMode={viewMode} />
      ) : (
        <div className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-8">
          {loadError ? (
            <>
              <div className="mb-8">
                <h2 className="page-title">Projects</h2>
                <p className="mt-1.5 text-sm text-muted">
                  Manage your projects and keep everything moving.
                </p>
              </div>
              <div
                role="alert"
                className="card-surface flex flex-col items-start gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Couldn&apos;t load projects
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Try again to view your projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={retryLoad}
                  className="inline-flex h-9 cursor-pointer items-center rounded-[8px] btn-secondary px-3.5 text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            </>
          ) : !hasAnyProjects ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
              <div className="mb-6 flex size-16 items-center justify-center rounded-[20px] bg-surface text-ink sm:size-[4.5rem]">
                <FolderKanban
                  className="size-7 sm:size-8"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <h2 className="font-[family-name:var(--font-brand)] text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                No projects yet
              </h2>
              <p className="mt-3 max-w-lg text-center text-base leading-relaxed text-muted">
                Create your first project to start managing your work and
                sharing it with clients.
              </p>
              <button
                type="button"
                onClick={openNewProject}
                className="mt-8 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent px-5 text-sm font-semibold"
              >
                <Plus className="size-4" strokeWidth={2.25} />
                Create Project
              </button>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="page-title">Projects</h2>
              <p className="mt-1.5 text-sm text-muted">
                Manage your projects and keep everything moving.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <div
                role="group"
                aria-label="Project layout"
                className="inline-flex h-11 items-center gap-0.5 rounded-[8px] border border-border bg-card p-1"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === "list"}
                  onClick={() => setView("list")}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    viewMode === "list"
                      ? "bg-surface text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <LayoutList className="size-3.5" strokeWidth={1.75} />
                  List
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setView("grid")}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    viewMode === "grid"
                      ? "bg-surface text-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <LayoutGrid className="size-3.5" strokeWidth={1.75} />
                  Grid
                </button>
              </div>

              <button
                type="button"
                onClick={openNewProject}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold"
              >
                <Plus className="size-4" strokeWidth={2.25} />
                New Project
              </button>
            </div>
          </div>

              {/* Search + filters + sort */}
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 transition-colors focus-within:border-border-strong lg:max-w-md">
                  <Search
                    className="size-4 shrink-0 text-muted"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search projects..."
                    aria-label="Search projects"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
                  />
                  {query ? (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <div
                    role="group"
                    aria-label="Project status"
                    className="flex flex-wrap gap-1.5"
                  >
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilter(f.id)}
                        className={chipClass(filter === f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <MultiSelectDropdown
                    allLabel="All payments"
                    widthLabel={PROJECTS_FILTER_WIDTHS.payments}
                    options={PAYMENT_CHOICES}
                    selected={paymentFilters}
                    onChange={(next) =>
                      setPaymentFilters(next as PaymentFilter[])
                    }
                    menuWidthClass="w-44"
                  />
                  <MultiSelectDropdown
                    allLabel="All clients"
                    widthLabel={PROJECTS_FILTER_WIDTHS.clients}
                    options={clients.map((c) => ({ id: c, label: c }))}
                    selected={clientFilters}
                    onChange={setClientFilters}
                  />
                  <MenuDropdown
                    value={sort}
                    onChange={(v) => setSort(v as SortKey)}
                    options={SORT_OPTIONS}
                    labelPrefix="Sort: "
                    widthLabel={PROJECTS_FILTER_WIDTHS.sort}
                  />
                </div>
              </div>

              {emptyTitle ? (
                <div className="card-surface flex min-h-0 flex-1 flex-col">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear filters",
                            onClick: clearFilters,
                          }
                        : undefined
                    }
                    compact
                    className="flex-1"
                  />
                </div>
              ) : viewMode === "list" ? (
                <div className="card-surface overflow-hidden">
                  <div
                    className={`hidden items-center border-b border-border bg-surface/50 px-5 py-2.5 text-xs font-medium text-muted lg:grid lg:gap-4 ${LIST_COLS}`}
                  >
                    <span>Project</span>
                    <span>Client</span>
                    <span>Due</span>
                    <span>Status</span>
                    <span>Payment</span>
                    <span>Value</span>
                    <span>Paid</span>
                    <span>Remaining</span>
                    <span>Progress</span>
                    <span className="sr-only">Actions</span>
                  </div>

                  <ul>
                    {filtered.map((project) => {
                      const payKey =
                        project.paymentStatus === "partial"
                          ? "due"
                          : project.paymentStatus;
                      const remaining = Math.max(
                        0,
                        project.value - project.paid,
                      );
                      const openProject = () =>
                        router.push(`/projects/${project.slug}`);
                      return (
                        <li
                          key={project.id}
                          className="border-b border-border last:border-0"
                        >
                          <div
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              const t = e.target as HTMLElement;
                              if (
                                t.closest("button") ||
                                t.closest("a") ||
                                t.closest("[role='menu']")
                              ) {
                                return;
                              }
                              openProject();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openProject();
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setMenuId(project.id);
                              setMenuPos({ x: e.clientX, y: e.clientY });
                            }}
                            className={`grid cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-hover has-[[data-hover-stop]:hover]:bg-transparent lg:gap-4 ${LIST_COLS}`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {project.name}
                              </p>
                            </div>

                            <p className="min-w-0 truncate text-sm text-muted">
                              {project.client}
                            </p>

                            <span
                              className={`inline-flex w-fit max-w-full justify-self-start items-center truncate rounded-md px-2 py-1 text-[11px] font-semibold ${deadlineToneSurface(
                                project.deadlineLabel,
                              )}`}
                            >
                              {project.deadlineLabel}
                            </span>

                            <div className="min-w-0">
                              <StatusBadge
                                label={projectLabel(project.status)}
                                tone={projectStatusTone(project.status)}
                                icon={projectStatusIcon(project.status)}
                              />
                            </div>

                            <div className="min-w-0">
                              <StatusBadge
                                label={paymentLabel(payKey)}
                                tone={paymentStatusTone(payKey)}
                                icon={paymentStatusIcon(payKey)}
                              />
                            </div>

                            <p className="min-w-0 truncate text-sm font-medium text-ink">
                              {formatMoney(project.value)}
                            </p>

                            <p
                              className={`min-w-0 truncate text-sm font-medium ${moneyToneClass("paid")}`}
                            >
                              {formatMoney(project.paid)}
                            </p>

                            <p
                              className={`min-w-0 truncate text-sm font-medium ${
                                remaining <= 0
                                  ? moneyToneClass("paid")
                                  : moneyToneClass(payKey)
                              }`}
                            >
                              {formatMoney(remaining)}
                            </p>

                            <div className="min-w-0">
                              <ProgressBar
                                value={project.progress}
                                meta={`${project.progress}%`}
                              />
                            </div>

                            <div className="relative flex w-full flex-nowrap items-center justify-end gap-2">
                              <button
                                type="button"
                                aria-label="Copy portal link"
                                data-hover-stop
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void copyPortalLink(project);
                                }}
                                className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium text-muted hover-soft"
                              >
                                <Copy
                                  className="size-3.5"
                                  strokeWidth={1.75}
                                />
                                Copy link
                              </button>
                              <Link
                                href={`/projects/${project.slug}`}
                                onClick={(e) => e.stopPropagation()}
                                data-hover-stop
                                className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[8px] btn-accent px-3.5 text-sm font-medium"
                              >
                                Open
                              </Link>
                              <button
                                type="button"
                                data-hover-stop
                                aria-label="Project actions"
                                aria-expanded={menuId === project.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (menuId === project.id) {
                                    closeMenu();
                                    return;
                                  }
                                  const rect = (
                                    e.currentTarget as HTMLButtonElement
                                  ).getBoundingClientRect();
                                  setMenuId(project.id);
                                  setMenuPos({
                                    x: Math.min(
                                      rect.right - 208,
                                      window.innerWidth - 220,
                                    ),
                                    y: rect.bottom + 6,
                                  });
                                }}
                                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-muted outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20"
                              >
                                <MoreHorizontal
                                  className="size-4"
                                  strokeWidth={1.75}
                                />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <ul className="grid gap-2.5 lg:grid-cols-2">
                  {filtered.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      compact
                      onOpen={() =>
                        router.push(`/projects/${project.slug}`)
                      }
                      onCopyLink={() => void copyPortalLink(project)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuId(project.id);
                        setMenuPos({ x: e.clientX, y: e.clientY });
                      }}
                      menu={
                        <>
                          <button
                            type="button"
                            aria-label="Project actions"
                            aria-expanded={
                              menuId === project.id && !menuPos
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (menuId === project.id && !menuPos) {
                                closeMenu();
                              } else {
                                setMenuId(project.id);
                                setMenuPos(null);
                              }
                            }}
                            data-hover-stop
                            className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-muted hover-soft"
                          >
                            <MoreHorizontal
                              className="size-4"
                              strokeWidth={1.75}
                            />
                          </button>
                          {menuId === project.id && !menuPos ? (
                            <ProjectRowMenu
                              open
                              showComplete={
                                project.status !== "completed"
                              }
                              onClose={closeMenu}
                              onAction={(a) => onMenuAction(project, a)}
                            />
                          ) : null}
                        </>
                      }
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {menuId && menuPos ? (
        <ProjectRowMenu
          open
          position={menuPos}
          showComplete={
            projects.find((p) => p.id === menuId)?.status !== "completed"
          }
          onClose={closeMenu}
          onAction={(a) => {
            const project = projects.find((p) => p.id === menuId);
            if (project) onMenuAction(project, a);
            closeMenu();
          }}
        />
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget
            ? `Delete ${deleteTarget.name}?`
            : "Delete this project?"
        }
        description="This permanently removes the project and its associated project data."
        confirmLabel="Delete Project"
      />

      <PlanLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        onUpgrade={() => {
          setLimitOpen(false);
          setUpgradeOpen(true);
        }}
        title="You've reached your project limit."
        limitLine="Free includes 1 active project."
        message="Upgrade to Pro to create unlimited projects."
      />
      <UpgradeCheckout
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSuccess={() => {
          upgradeToPro();
        }}
      />
    </div>
  );
}
