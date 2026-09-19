"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  GripVertical,
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
  type AddClientInput,
} from "@/lib/clientsStore";
import {
  buildCreatedProject,
  commitCreatedProject,
  deadlineIsPast,
  removeCreatedProject,
  type CreateProjectTaskInput,
  type FieldErrors,
} from "@/lib/createProject";
import { backgroundSync } from "@/lib/optimistic";
import { uniqueProjectSlug } from "@/lib/projectSlug";
import { useBilling } from "@/lib/billingStore";
import type { Client } from "@/data/clientsMock";
import {
  PlanLimitModal,
  UpgradeCheckout,
} from "./billing/BillingModals";
import DashboardTopBar from "./DashboardTopBar";
import Popup, { PopupCloseButton } from "./Popup";
import { useToast } from "./ToastProvider";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

const inputClass =
  "h-11 w-full rounded-[8px] border bg-card px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink focus-visible:ring-2 focus-visible:ring-ink/15 disabled:opacity-60";
const inputOk = "border-border";
const inputErr = "border-danger focus:border-danger";

type DraftTask = CreateProjectTaskInput & { key: string };

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

function Section({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const { canCreateProject, upgradeToPro } = useBilling();

  const [limitOpen, setLimitOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"active" | "draft">("active");
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

  const markDirty = () => {
    dirtyRef.current = true;
  };

  useEffect(() => {
    try {
      setClients(getAllClients());
      setClientsReady(true);
    } catch {
      setClientsError(true);
      setClientsReady(true);
    }
  }, []);

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

  const previewSlug = useMemo(
    () => (name.trim() ? uniqueProjectSlug(name) : ""),
    [name],
  );

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
    pendingLeave.current?.();
    pendingLeave.current = null;
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

  const moveTask = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= tasks.length) return;
    markDirty();
    setTasks((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!canCreateProject) {
      setLimitOpen(true);
      return;
    }

    setErrors({});

    const built = buildCreatedProject({
      name,
      clientId: selectedClient?.id ?? null,
      clientName: selectedClient?.name ?? "",
      clientEmail: selectedClient?.email ?? "",
      description,
      value,
      currency,
      deadline,
      status,
      tasks: tasks.map(({ name: n, description: d, done, visibleToClient }) => ({
        name: n,
        description: d,
        done,
        visibleToClient,
      })),
    });

    if (!built.ok) {
      setErrors(built.errors);
      return;
    }

    setSubmitting(true);
    dirtyRef.current = false;
    commitCreatedProject(built.project);
    toastSuccess("Project created");
    router.push(`/projects/${built.project.slug}`);

    void backgroundSync().then((result) => {
      if (!result.ok) {
        removeCreatedProject(built.project.id);
        toastError(
          "Couldn't create the project. Your changes weren't saved. Try again.",
        );
        setSubmitting(false);
        dirtyRef.current = true;
        router.replace("/projects/new");
      }
    });
  };

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar
        breadcrumb={[
          { label: "Projects", href: "/projects" },
          { label: "Create Project" },
        ]}
      />

      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => requestLeave(() => router.push("/projects"))}
          className="mb-5 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Projects
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="page-title">Create Project</h2>
            <p className="mt-1.5 text-sm text-muted">
              Set up the basics for your new project.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Project Details">
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
                />
              </Field>
              {previewSlug ? (
                <p className="text-xs text-muted">
                  Portal link will be{" "}
                  <span className="font-medium text-ink">/p/{previewSlug}</span>
                </p>
              ) : null}
            </Section>

            <Section title="Client">
              {!clientsReady ? (
                <div className="auth-skeleton h-11 w-full rounded-[8px]" />
              ) : clientsError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border bg-surface px-4 py-3">
                  <p className="text-sm text-muted">
                    Couldn&apos;t load clients. Try again.
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
                        className={`flex items-center gap-3 rounded-[8px] border bg-background px-3 py-2.5 ${
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
                          aria-autocomplete="list"
                          value={clientQuery}
                          onChange={(e) => {
                            setClientQuery(e.target.value);
                            setClientOpen(true);
                            clearFieldError("client");
                            markDirty();
                          }}
                          onFocus={() => setClientOpen(true)}
                          placeholder="Search clients..."
                          className={`${inputClass} bg-background pl-10 pr-10 ${
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
                        className="absolute left-0 right-0 z-30 mt-1.5 max-h-56 overflow-y-auto rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
                      >
                        {clients.length === 0 ? (
                          <li className="px-3 py-6 text-center text-sm text-muted">
                            No clients yet
                          </li>
                        ) : filteredClients.length === 0 ? (
                          <li className="px-3 py-6 text-center">
                            <p className="text-sm font-medium text-ink">
                              No clients found
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Try another name or email.
                            </p>
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
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ink/20"
                    >
                      <UserPlus className="size-3.5" strokeWidth={2} />
                      Add New Client
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-[10px] border border-border bg-background p-4">
                      <p className="text-sm font-semibold text-ink">
                        New client
                      </p>
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
                          placeholder="e.g. Sarah Johnson"
                          className={`${inputClass} bg-card ${
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
                          className={`${inputClass} bg-card ${
                            newClientErrors.email ? inputErr : inputOk
                          }`}
                        />
                      </Field>
                      {duplicateHint ? (
                        <div className="rounded-[8px] border border-border bg-card px-3 py-2.5 text-sm">
                          <p className="text-muted">
                            A client with this email already exists.
                          </p>
                          <button
                            type="button"
                            onClick={() => selectClient(duplicateHint)}
                            className="mt-1.5 cursor-pointer font-semibold text-ink underline-offset-2 hover:underline"
                          >
                            Use existing client
                          </button>
                        </div>
                      ) : null}
                      <Field id="new-client-company" label="Company" optional>
                        <input
                          id="new-client-company"
                          value={newClient.company}
                          onChange={(e) =>
                            setNewClient((p) => ({
                              ...p,
                              company: e.target.value,
                            }))
                          }
                          placeholder="e.g. Acme Studio"
                          className={`${inputClass} bg-card ${inputOk}`}
                        />
                      </Field>
                      <Field id="new-client-phone" label="Phone" optional>
                        <input
                          id="new-client-phone"
                          value={newClient.phone}
                          onChange={(e) =>
                            setNewClient((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          className={`${inputClass} bg-card ${inputOk}`}
                        />
                      </Field>
                      <Field
                        id="new-client-notes"
                        label="Private notes"
                        optional
                      >
                        <textarea
                          id="new-client-notes"
                          rows={2}
                          value={newClient.notes}
                          onChange={(e) =>
                            setNewClient((p) => ({
                              ...p,
                              notes: e.target.value,
                            }))
                          }
                          className={`w-full resize-none rounded-[8px] border border-border bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink`}
                        />
                      </Field>
                      {newClientErrors.form ? (
                        <p className="text-xs text-danger" role="alert">
                          {newClientErrors.form}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
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
            </Section>
          </div>

          <Section title="Project Information">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  placeholder="e.g. 2400"
                  className={`${inputClass} bg-background ${
                    errors.value ? inputErr : inputOk
                  }`}
                />
              </Field>
              <Field id="currency" label="Currency" error={errors.currency}>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    clearFieldError("currency");
                    markDirty();
                  }}
                  className={`${inputClass} bg-background ${
                    errors.currency ? inputErr : inputOk
                  }`}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </Field>
              <Field
                id="deadline"
                label="Deadline"
                optional
                error={errors.deadline}
                hint={
                  pastDeadline
                    ? "This deadline is in the past."
                    : undefined
                }
              >
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    clearFieldError("deadline");
                    markDirty();
                  }}
                  className={`${inputClass} bg-background ${
                    errors.deadline ? inputErr : inputOk
                  }`}
                />
              </Field>
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Status</p>
                <div className="flex gap-2" role="group" aria-label="Status">
                  {(
                    [
                      { id: "active", label: "Active" },
                      { id: "draft", label: "Draft" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={status === opt.id}
                      onClick={() => {
                        setStatus(opt.id);
                        markDirty();
                      }}
                      className={`h-11 flex-1 cursor-pointer rounded-[8px] text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                        status === opt.id
                          ? "bg-accent text-ink"
                          : "border border-border bg-background text-muted hover:bg-surface-hover"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {status === "draft" ? (
                  <p className="mt-2 text-xs text-muted">
                    Won&apos;t appear as active client-facing work until marked
                    Active.
                  </p>
                ) : null}
              </div>
            </div>
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Description">
              <Field
                id="description"
                label="Project description"
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
                  placeholder="Briefly describe what this project is about..."
                  rows={6}
                  className={`w-full resize-none rounded-[8px] border bg-background px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink focus-visible:ring-2 focus-visible:ring-ink/15 ${
                    errors.description ? inputErr : inputOk
                  }`}
                />
              </Field>
            </Section>

            <Section
              title="Initial Tasks"
              description="Add a few tasks now, or create them later from the project."
            >
              {errors.tasks ? (
                <p className="text-xs text-danger" role="alert">
                  {errors.tasks}
                </p>
              ) : null}

              <ul className="space-y-2">
                {tasks.map((task, index) => (
                  <li
                    key={task.key}
                    className="rounded-[10px] border border-border bg-background p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 pt-1">
                        <button
                          type="button"
                          aria-label="Move task up"
                          disabled={index === 0}
                          onClick={() => moveTask(index, -1)}
                          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted disabled:opacity-30 hover:bg-surface-hover hover:text-ink"
                        >
                          <GripVertical
                            className="size-3.5"
                            strokeWidth={1.75}
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={
                          task.done ? "Mark incomplete" : "Mark complete"
                        }
                        onClick={() =>
                          updateTask(task.key, { done: !task.done })
                        }
                        className={`mt-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                          task.done
                            ? "border-ink bg-ink text-card"
                            : "border-border"
                        }`}
                      >
                        {task.done ? (
                          <Check className="size-3" strokeWidth={3} />
                        ) : null}
                      </button>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) =>
                            updateTask(task.key, { name: e.target.value })
                          }
                          placeholder="Task name"
                          aria-label="Task name"
                          className="h-9 w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-muted-soft"
                        />
                        <input
                          type="text"
                          value={task.description ?? ""}
                          onChange={(e) =>
                            updateTask(task.key, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Optional description"
                          aria-label="Task description"
                          className="h-8 w-full bg-transparent text-xs text-muted outline-none placeholder:text-muted-soft"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateTask(task.key, {
                              visibleToClient: !task.visibleToClient,
                            })
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1.5 py-1 text-xs font-medium text-muted outline-none hover:bg-surface-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                        >
                          {task.visibleToClient ? (
                            <>
                              <Eye className="size-3.5" strokeWidth={1.75} />
                              Visible to client
                            </>
                          ) : (
                            <>
                              <Lock className="size-3.5" strokeWidth={1.75} />
                              Private
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove task"
                        onClick={() => removeTask(task.key)}
                        className="mt-0.5 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-muted hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {tasks.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-border bg-background px-4 py-8 text-center">
                  <p className="text-sm text-muted">
                    No tasks yet — add a few milestones or skip for now.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={addTask}
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[8px] border border-border bg-background px-3 text-sm font-medium text-ink outline-none hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20 sm:w-auto"
              >
                <Plus className="size-3.5" strokeWidth={2.25} />
                Add Task
              </button>
            </Section>
          </div>

          {errors.form ? (
            <div
              className="card-surface border-danger/40 bg-danger-soft px-5 py-4 text-sm text-danger"
              role="alert"
            >
              {errors.form}
            </div>
          ) : null}

          <div className="card-surface flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted">
              You can refine tasks, files, and the portal after creating.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => requestLeave(() => router.push("/projects"))}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={submitting}
              >
                Create Project
              </Button>
            </div>
          </div>
        </form>
      </div>

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
            className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
          >
            You have unsaved changes
          </h2>
          <p className="mt-2 text-sm text-muted">
            Leave this page and lose your progress, or stay and keep editing.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setUnsavedOpen(false);
                pendingLeave.current = null;
              }}
            >
              Stay
            </Button>
            <Button type="button" variant="danger" onClick={confirmLeave}>
              Leave
            </Button>
          </div>
        </div>
      </Popup>

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
