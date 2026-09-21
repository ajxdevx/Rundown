"use client";

import {
  ChevronDown,
  Eye,
  Lock,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addClientOptimistic,
  getAllClients,
  getClientById,
  CLIENTS_CHANGED,
  type AddClientInput,
} from "@/lib/clientsStore";
import {
  buildCreatedProject,
  commitCreatedProject,
  deadlineIsPast,
  removeCreatedProject,
  updateCreatedProject,
  type CreatedProject,
  type CreatedProjectTask,
  type CreateProjectTaskInput,
  type FieldErrors,
  type ProjectLifecycleStatus,
} from "@/lib/createProject";
import { backgroundSync } from "@/lib/optimistic";
import { useBilling } from "@/lib/billingStore";
import type { Client } from "@/data/clientsMock";
import {
  PlanLimitModal,
  UpgradeCheckout,
} from "./billing/BillingModals";
import Popup, { PopupCloseButton } from "./Popup";
import { useToast } from "./ToastProvider";
import { Avatar } from "./ui/Avatar";
import { AppCheckbox } from "./ui/AppCheckbox";
import { Button } from "./ui/Button";

const DRAFT_KEY = "dueso:create-project-draft";
const WORKSPACE_CURRENCY = "USD";

const inputClass =
  "h-11 w-full rounded-[8px] border bg-card px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink disabled:opacity-60";
const inputOk = "border-border";
const inputErr = "border-danger focus:border-danger";

type DraftTask = CreateProjectTaskInput & { key: string; id?: string };

type CreateDraft = {
  name: string;
  description: string;
  value: string;
  deadline: string;
  status: ProjectLifecycleStatus;
  tasks: DraftTask[];
  selectedClientId: string | null;
};

export type ProjectFormEditValues = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  description: string;
  value: number | null;
  currency: string;
  deadline: string;
  status: ProjectLifecycleStatus;
  tasks: CreatedProjectTask[];
};

export type ProjectFormModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  preselectedClientId?: string;
  restoreDraft?: boolean;
  initial?: ProjectFormEditValues | null;
  /** Called after a successful create (before navigate) or edit. */
  onSuccess?: (project: CreatedProject | ProjectFormEditValues) => void;
  /** When true, skip router.push after create (caller handles navigation). */
  skipNavigate?: boolean;
};

function saveDraft(draft: CreateDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

function loadDraft(): CreateDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateDraft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

function Field({
  id,
  label,
  error,
  optional,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional ? (
          <span className="ml-1.5 font-normal text-muted">optional</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function normalizeDeadlineInput(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProjectFormModal({
  open,
  onClose,
  mode = "create",
  preselectedClientId,
  restoreDraft = false,
  initial = null,
  onSuccess,
  skipNavigate = false,
}: ProjectFormModalProps) {
  const router = useRouter();
  const { error: toastError, toast } = useToast();
  const { canCreateProject, upgradeToPro } = useBilling();
  const isEdit = mode === "edit";

  const [limitOpen, setLimitOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ProjectLifecycleStatus>("active");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsReady, setClientsReady] = useState(false);
  const [clientsError, setClientsError] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState<AddClientInput>({
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });
  const [newClientErrors, setNewClientErrors] = useState<
    Partial<Record<"name" | "email" | "form", string>>
  >({});
  const [duplicateHint, setDuplicateHint] = useState<Client | null>(null);

  const clientBoxRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);
  const pendingLeave = useRef<null | (() => void)>(null);
  const hydratedRef = useRef(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setValue("");
    setDeadline("");
    setStatus("active");
    setTasks([]);
    setErrors({});
    setSelectedClient(null);
    setClientQuery("");
    setClientOpen(false);
    setAddClientOpen(false);
    setNewClient({ name: "", email: "", company: "", phone: "", notes: "" });
    setNewClientErrors({});
    setDuplicateHint(null);
    setSubmitting(false);
    dirtyRef.current = false;
    hydratedRef.current = false;
  };

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const refreshClients = () => {
    try {
      setClients(getAllClients());
      setClientsError(false);
    } catch {
      setClientsError(true);
    } finally {
      setClientsReady(true);
    }
  };

  useEffect(() => {
    refreshClients();
    window.addEventListener(CLIENTS_CHANGED, refreshClients);
    return () => window.removeEventListener(CLIENTS_CHANGED, refreshClients);
  }, []);

  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      return;
    }
    if (!clientsReady || hydratedRef.current) return;
    hydratedRef.current = true;

    if (isEdit && initial) {
      setName(initial.name);
      setDescription(initial.description);
      setValue(initial.value != null ? String(initial.value) : "");
      setDeadline(normalizeDeadlineInput(initial.deadline));
      setStatus(initial.status);
      setTasks(
        initial.tasks.map((t, i) => ({
          key: t.id || `t_${i}`,
          id: t.id,
          name: t.name,
          description: t.description ?? "",
          done: t.done,
          visibleToClient: t.visibleToClient,
        })),
      );
      if (initial.clientId) {
        const c = getClientById(initial.clientId);
        if (c) setSelectedClient(c);
        else if (initial.clientName) {
          setSelectedClient({
            id: initial.clientId,
            name: initial.clientName,
            email: initial.clientEmail,
            company: null,
            phone: null,
            notes: null,
            status: "active",
            lastActive: "",
            lastActiveSort: 0,
            createdAt: "",
            createdSort: 0,
            projects: [],
            activity: [],
            outstanding: 0,
          });
        }
      }
      dirtyRef.current = false;
      return;
    }

    if (restoreDraft) {
      const draft = loadDraft();
      if (draft) {
        setName(draft.name);
        setDescription(draft.description);
        setValue(draft.value);
        setDeadline(draft.deadline);
        setStatus(draft.status);
        setTasks(draft.tasks);
        if (draft.selectedClientId) {
          const c = getClientById(draft.selectedClientId);
          if (c) setSelectedClient(c);
        }
        dirtyRef.current = true;
        return;
      }
    } else {
      clearDraft();
    }

    if (preselectedClientId) {
      const c = getClientById(preselectedClientId);
      if (c) setSelectedClient(c);
    }
  }, [open, clientsReady, preselectedClientId, restoreDraft, isEdit, initial]);

  useEffect(() => {
    if (!open) return;
    if (!canCreateProject && !isEdit) {
      setLimitOpen(true);
    }
  }, [open, canCreateProject, isEdit]);

  useEffect(() => {
    if (!clientOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!clientBoxRef.current?.contains(e.target as Node)) {
        setClientOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClientOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [clientOpen]);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false),
    );
  }, [clients, clientQuery]);

  const pastDeadline = deadline.trim() ? deadlineIsPast(deadline) : false;

  const clearFieldError = (key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const requestLeave = (action: () => void) => {
    if (!dirtyRef.current) {
      action();
      return;
    }
    pendingLeave.current = action;
    setUnsavedOpen(true);
  };

  const confirmLeave = () => {
    setUnsavedOpen(false);
    dirtyRef.current = false;
    clearDraft();
    pendingLeave.current?.();
    pendingLeave.current = null;
  };

  const requestClose = () => {
    requestLeave(() => {
      resetForm();
      onClose();
    });
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientQuery("");
    setClientOpen(false);
    setAddClientOpen(false);
    clearFieldError("client");
    markDirty();
  };

  const createInlineClient = () => {
    setNewClientErrors({});
    const existing = clients.find(
      (c) =>
        c.email.trim().toLowerCase() === newClient.email.trim().toLowerCase(),
    );
    if (existing) {
      setDuplicateHint(existing);
      return;
    }

    const result = addClientOptimistic(newClient);
    if (!result.ok) {
      setNewClientErrors(result.errors);
      return;
    }

    setClients((prev) => [result.client, ...prev]);
    selectClient(result.client);
    setNewClient({ name: "", email: "", company: "", phone: "", notes: "" });
    setDuplicateHint(null);
    setAddClientOpen(false);

    void backgroundSync().then((r) => {
      if (!r.ok) {
        toastError("Couldn't create the client. Try again.");
      }
    });
  };

  const addTask = () => {
    markDirty();
    setTasks((prev) => [
      ...prev,
      {
        key: `t_${Date.now()}_${prev.length}`,
        name: "",
        description: "",
        done: false,
        visibleToClient: false,
      },
    ]);
    clearFieldError("tasks");
  };

  const updateTask = (key: string, patch: Partial<DraftTask>) => {
    markDirty();
    setTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    );
  };

  const removeTask = (key: string) => {
    markDirty();
    setTasks((prev) => prev.filter((t) => t.key !== key));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!isEdit && !canCreateProject) {
      setLimitOpen(true);
      return;
    }

    setErrors({});

    const taskInputs = tasks.map(
      ({ name: n, description: d, done, visibleToClient, id }) => ({
        id,
        name: n,
        description: d,
        done,
        visibleToClient,
      }),
    );

    if (isEdit && initial) {
      const built = buildCreatedProject({
        name,
        clientId: selectedClient?.id ?? null,
        clientName: selectedClient?.name ?? "",
        clientEmail: selectedClient?.email ?? "",
        description,
        value,
        currency: initial.currency || WORKSPACE_CURRENCY,
        deadline,
        status,
        tasks: taskInputs.map(
          ({ name: n, description: d, done, visibleToClient }) => ({
            name: n,
            description: d,
            done,
            visibleToClient,
          }),
        ),
      });

      if (!built.ok) {
        setErrors(built.errors);
        return;
      }

      setSubmitting(true);
      dirtyRef.current = false;

      const nextTasks: CreatedProjectTask[] = taskInputs
        .filter((t) => t.name.trim())
        .map((t, i) => ({
          id: t.id || `task_${Date.now()}_${i}`,
          name: t.name.trim(),
          description: t.description?.trim() || undefined,
          done: t.done,
          visibleToClient: t.visibleToClient,
        }));

      const valueNum = built.project.value;
      const patch = {
        name: built.project.name,
        clientId: built.project.clientId,
        clientName: built.project.clientName,
        clientEmail: built.project.clientEmail,
        description: built.project.description,
        value: valueNum,
        currency: built.project.currency,
        deadline: built.project.deadline,
        status: built.project.status,
        tasks: nextTasks,
      };

      const updated = updateCreatedProject(initial.id, patch);
      const result: ProjectFormEditValues = {
        id: initial.id,
        ...patch,
        currency: patch.currency,
      };
      onSuccess?.(updated ?? result);
      resetForm();
      onClose();

      void backgroundSync().then((r) => {
        if (!r.ok) {
          toastError("Couldn't save the project. Try again.");
        }
      });
      return;
    }

    const built = buildCreatedProject({
      name,
      clientId: selectedClient?.id ?? null,
      clientName: selectedClient?.name ?? "",
      clientEmail: selectedClient?.email ?? "",
      description,
      value,
      currency: WORKSPACE_CURRENCY,
      deadline,
      status: status === "draft" ? "draft" : "active",
      tasks: taskInputs.map(
        ({ name: n, description: d, done, visibleToClient }) => ({
          name: n,
          description: d,
          done,
          visibleToClient,
        }),
      ),
    });

    if (!built.ok) {
      setErrors(built.errors);
      return;
    }

    setSubmitting(true);
    dirtyRef.current = false;
    saveDraft({
      name,
      description,
      value,
      deadline,
      status,
      tasks,
      selectedClientId: selectedClient?.id ?? null,
    });
    commitCreatedProject(built.project);
    onSuccess?.(built.project);
    resetForm();
    onClose();
    if (!skipNavigate) {
      router.push(`/projects/${built.project.slug}`);
    }

    void backgroundSync().then((result) => {
      if (!result.ok) {
        removeCreatedProject(built.project.id);
        toast({
          title: "Couldn't create the project. Please try again.",
          tone: "error",
          actionLabel: "Retry",
          onAction: () => {
            /* provider / page can reopen with restore */
          },
        });
        dirtyRef.current = true;
      } else {
        clearDraft();
      }
    });
  };

  const createStatusOptions = [
    { id: "active" as const, label: "Active" },
    { id: "draft" as const, label: "Draft" },
  ];

  const editStatusOptions = [
    { id: "active" as const, label: "Active" },
    { id: "draft" as const, label: "Draft" },
    { id: "on-hold" as const, label: "On Hold" },
    { id: "completed" as const, label: "Completed" },
    { id: "archived" as const, label: "Archived" },
  ];
  const statusOptions = isEdit ? editStatusOptions : createStatusOptions;

  return (
    <>
      <Popup
        open={open && !limitOpen}
        onClose={requestClose}
        labelledBy="project-form-title"
        align="center"
        panelClassName="w-[min(100vw-2rem,56rem)] bg-card"
      >
        <form onSubmit={onSubmit} noValidate>
          <div className="relative border-b border-border px-6 py-5 sm:px-7">
            <div className="absolute right-4 top-4">
              <PopupCloseButton onClick={requestClose} />
            </div>
            <h2
              id="project-form-title"
              className="pr-10 text-lg font-semibold tracking-tight text-ink"
            >
              {isEdit ? "Edit Project" : "Create Project"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update project information."
                : "Set up the basics for your new project."}
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-5 px-6 py-5 sm:px-7 md:grid-cols-2">
            <div className="space-y-4">
              <Field id="project-name" label="Project name" error={errors.name}>
                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError("name");
                    markDirty();
                  }}
                  placeholder="e.g. Website Redesign"
                  className={`${inputClass} ${errors.name ? inputErr : inputOk}`}
                  autoComplete="off"
                  autoFocus
                />
              </Field>

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Client</p>
                {!clientsReady ? (
                  <div className="auth-skeleton h-11 w-full rounded-[8px]" />
                ) : clientsError ? (
                  <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border px-3 py-2.5">
                    <p className="text-sm text-muted">
                      Couldn&apos;t load clients.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setClientsError(false);
                        setClients(getAllClients());
                      }}
                      className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div ref={clientBoxRef} className="relative">
                      {selectedClient ? (
                        <div
                          className={`flex items-center gap-3 rounded-[8px] border bg-card px-3 py-2 ${
                            errors.client ? inputErr : inputOk
                          }`}
                        >
                          <Avatar name={selectedClient.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">
                              {selectedClient.name}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {[selectedClient.company, selectedClient.email]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="Change client"
                            onClick={() => {
                              setSelectedClient(null);
                              setClientOpen(true);
                              markDirty();
                            }}
                            className="flex size-8 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                          >
                            <X className="size-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                            strokeWidth={1.75}
                          />
                          <input
                            id="client-search"
                            type="text"
                            role="combobox"
                            aria-expanded={clientOpen}
                            aria-controls="client-listbox"
                            value={clientQuery}
                            onChange={(e) => {
                              setClientQuery(e.target.value);
                              setClientOpen(true);
                              clearFieldError("client");
                              markDirty();
                            }}
                            onFocus={() => setClientOpen(true)}
                            placeholder="Search clients..."
                            className={`${inputClass} pl-10 pr-10 ${
                              errors.client ? inputErr : inputOk
                            }`}
                          />
                          <ChevronDown
                            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                            strokeWidth={1.75}
                          />
                        </div>
                      )}

                      {clientOpen && !selectedClient ? (
                        <ul
                          id="client-listbox"
                          role="listbox"
                          className="absolute left-0 right-0 z-30 mt-1.5 max-h-44 overflow-y-auto rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
                        >
                          {filteredClients.length === 0 ? (
                            <li className="px-3 py-4 text-center text-sm text-muted">
                              No clients found
                            </li>
                          ) : (
                            filteredClients.map((c) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  role="option"
                                  onClick={() => selectClient(c)}
                                  className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-2.5 py-2 text-left hover-soft"
                                >
                                  <Avatar name={c.name} size="sm" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-ink">
                                      {c.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted">
                                      {[c.company, c.email]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      ) : null}
                    </div>
                    {errors.client ? (
                      <p className="mt-1.5 text-xs text-danger" role="alert">
                        {errors.client}
                      </p>
                    ) : null}

                    {!addClientOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddClientOpen(true);
                          setClientOpen(false);
                        }}
                        className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink hover:underline"
                      >
                        <UserPlus className="size-3.5" strokeWidth={2} />
                        Add New Client
                      </button>
                    ) : (
                      <div className="mt-3 space-y-2.5 rounded-[10px] border border-border p-3.5">
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <Field
                            id="new-client-name"
                            label="Name"
                            error={newClientErrors.name}
                          >
                            <input
                              id="new-client-name"
                              value={newClient.name}
                              onChange={(e) =>
                                setNewClient((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="Sarah Johnson"
                              className={`${inputClass} ${
                                newClientErrors.name ? inputErr : inputOk
                              }`}
                            />
                          </Field>
                          <Field
                            id="new-client-email"
                            label="Email"
                            error={newClientErrors.email}
                          >
                            <input
                              id="new-client-email"
                              type="email"
                              value={newClient.email}
                              onChange={(e) => {
                                setNewClient((p) => ({
                                  ...p,
                                  email: e.target.value,
                                }));
                                setDuplicateHint(null);
                              }}
                              placeholder="sarah@example.com"
                              className={`${inputClass} ${
                                newClientErrors.email ? inputErr : inputOk
                              }`}
                            />
                          </Field>
                        </div>
                        {duplicateHint ? (
                          <button
                            type="button"
                            onClick={() => selectClient(duplicateHint)}
                            className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
                          >
                            Use existing client instead
                          </button>
                        ) : null}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAddClientOpen(false);
                              setDuplicateHint(null);
                              setNewClientErrors({});
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            onClick={createInlineClient}
                          >
                            Add Client
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="value"
                  label="Project value"
                  optional
                  error={errors.value}
                >
                  <input
                    id="value"
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      clearFieldError("value");
                      markDirty();
                    }}
                    placeholder={`e.g. 2400 ${WORKSPACE_CURRENCY}`}
                    className={`${inputClass} ${errors.value ? inputErr : inputOk}`}
                  />
                </Field>
                <Field
                  id="deadline"
                  label="Deadline"
                  optional
                  error={errors.deadline}
                  hint={pastDeadline ? "Past date" : undefined}
                >
                  <div className="relative">
                    <input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => {
                        setDeadline(e.target.value);
                        clearFieldError("deadline");
                        markDirty();
                      }}
                      className={`${inputClass} pr-9 ${
                        errors.deadline ? inputErr : inputOk
                      }`}
                    />
                    {deadline ? (
                      <button
                        type="button"
                        aria-label="Clear deadline"
                        onClick={() => {
                          setDeadline("");
                          markDirty();
                        }}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                      >
                        <X className="size-3.5" strokeWidth={1.75} />
                      </button>
                    ) : null}
                  </div>
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Status</p>
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Status"
                >
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={status === opt.id}
                      onClick={() => {
                        setStatus(opt.id);
                        markDirty();
                      }}
                      className={`h-9 cursor-pointer rounded-[8px] px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                        status === opt.id
                          ? "bg-accent text-ink"
                          : "border border-border text-muted hover:bg-surface-hover hover:text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Field
                id="description"
                label="Project summary"
                optional
                error={errors.description}
              >
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearFieldError("description");
                    markDirty();
                  }}
                  placeholder="Describe the project..."
                  rows={3}
                  className={`w-full resize-none rounded-[8px] border px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink ${
                    errors.description ? inputErr : inputOk
                  }`}
                />
              </Field>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {isEdit ? "Tasks" : "Initial tasks"}
                    <span className="ml-1.5 font-normal text-muted">
                      optional
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-[8px] px-2.5 text-xs font-semibold text-ink hover-soft"
                  >
                    <Plus className="size-3.5" strokeWidth={2.25} />
                    Add Task
                  </button>
                </div>
                {errors.tasks ? (
                  <p className="mb-2 text-xs text-danger" role="alert">
                    {errors.tasks}
                  </p>
                ) : null}
                {tasks.length === 0 ? (
                  <p className="rounded-[8px] border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
                    No tasks yet — add some or skip for now.
                  </p>
                ) : (
                  <ul className="max-h-36 space-y-1.5 overflow-y-auto">
                    {tasks.map((task) => (
                      <li
                        key={task.key}
                        className="flex items-center gap-2 rounded-[8px] border border-border px-2.5 py-1.5"
                      >
                        <button
                          type="button"
                          aria-label={
                            task.done ? "Mark incomplete" : "Mark complete"
                          }
                          onClick={() =>
                            updateTask(task.key, { done: !task.done })
                          }
                          className="shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
                        >
                          <AppCheckbox checked={task.done} size="sm" />
                        </button>
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) =>
                            updateTask(task.key, { name: e.target.value })
                          }
                          placeholder="Task name"
                          aria-label="Task name"
                          className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
                        />
                        <button
                          type="button"
                          title={
                            task.visibleToClient
                              ? "Visible to client"
                              : "Private"
                          }
                          onClick={() =>
                            updateTask(task.key, {
                              visibleToClient: !task.visibleToClient,
                            })
                          }
                          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-surface-hover hover:text-ink"
                        >
                          {task.visibleToClient ? (
                            <Eye className="size-3.5" strokeWidth={1.75} />
                          ) : (
                            <Lock className="size-3.5" strokeWidth={1.75} />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Remove task"
                          onClick={() => removeTask(task.key)}
                          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.75} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {errors.form ? (
            <div
              className="mx-6 mb-4 rounded-[8px] border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger sm:mx-7"
              role="alert"
            >
              {errors.form}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 sm:px-7">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={submitting}
            >
              {isEdit ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </form>
      </Popup>

      <Popup
        open={unsavedOpen}
        onClose={() => {
          setUnsavedOpen(false);
          pendingLeave.current = null;
        }}
        labelledBy="unsaved-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton
              onClick={() => {
                setUnsavedOpen(false);
                pendingLeave.current = null;
              }}
            />
          </div>
          <h2
            id="unsaved-title"
            className="pr-10 text-xl font-semibold tracking-tight text-ink"
          >
            Discard project?
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your project information hasn&apos;t been saved.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setUnsavedOpen(false);
                pendingLeave.current = null;
              }}
            >
              Keep Editing
            </Button>
            <Button type="button" variant="danger" onClick={confirmLeave}>
              Discard
            </Button>
          </div>
        </div>
      </Popup>

      <PlanLimitModal
        open={limitOpen}
        onClose={() => {
          setLimitOpen(false);
          onClose();
          resetForm();
        }}
        onUpgrade={() => {
          setLimitOpen(false);
          setUpgradeOpen(true);
        }}
        title="You've reached your project limit"
        limitLine="Free includes 1 active project."
        message="Upgrade to Pro to create more projects."
      />
      <UpgradeCheckout
        open={upgradeOpen}
        onClose={() => {
          setUpgradeOpen(false);
          onClose();
          resetForm();
        }}
        onSuccess={() => {
          upgradeToPro();
          setUpgradeOpen(false);
        }}
      />
    </>
  );
}
