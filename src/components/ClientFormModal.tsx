"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Client, ClientStatus } from "@/data/clientsMock";
import {
  addClientOptimistic,
  deleteClientLocal,
  getAllClients,
  getClientById,
  updateClientOptimistic,
  type ClientFieldErrors,
} from "@/lib/clientsStore";
import { backgroundSync } from "@/lib/optimistic";
import Popup, { PopupCloseButton } from "./Popup";
import { useToast } from "./ToastProvider";
import { Button } from "./ui/Button";

const inputClass =
  "h-11 w-full rounded-[8px] border bg-card px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink";
const inputOk = "border-border";
const inputErr = "border-danger focus:border-danger";

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

export type ClientFormModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  clientId?: string;
  /** When true, stay put after create (e.g. nested in Create Project). */
  nestMode?: boolean;
  onCreated?: (client: Client) => void;
  onUpdated?: (client: Client) => void;
  skipNavigate?: boolean;
};

export default function ClientFormModal({
  open,
  onClose,
  mode = "add",
  clientId,
  nestMode = false,
  onCreated,
  onUpdated,
  skipNavigate = false,
}: ClientFormModalProps) {
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ClientStatus>("active");
  const [errors, setErrors] = useState<ClientFieldErrors>({});
  const [duplicate, setDuplicate] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const dirtyRef = useRef(false);
  const pendingClose = useRef<null | (() => void)>(null);
  const hydratedRef = useRef(false);
  const snapshotRef = useRef<{
    name: string;
    email: string;
    company: string;
    phone: string;
    notes: string;
    status: ClientStatus;
  } | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setNotes("");
    setStatus("active");
    setErrors({});
    setDuplicate(null);
    setSubmitting(false);
    dirtyRef.current = false;
    hydratedRef.current = false;
    snapshotRef.current = null;
  };

  const markDirty = () => {
    dirtyRef.current = true;
  };

  useEffect(() => {
    if (!open) {
      hydratedRef.current = false;
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    if (isEdit && clientId) {
      const client = getClientById(clientId);
      if (!client) {
        setErrors({ form: "Client not found." });
        return;
      }
      setName(client.name);
      setEmail(client.email);
      setCompany(client.company ?? "");
      setPhone(client.phone ?? "");
      setNotes(client.notes ?? "");
      setStatus(client.status);
      snapshotRef.current = {
        name: client.name,
        email: client.email,
        company: client.company ?? "",
        phone: client.phone ?? "",
        notes: client.notes ?? "",
        status: client.status,
      };
      dirtyRef.current = false;
      return;
    }

    reset();
    hydratedRef.current = true;
  }, [open, isEdit, clientId]);

  const clearError = (key: keyof ClientFieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const requestClose = () => {
    if (!dirtyRef.current) {
      reset();
      onClose();
      return;
    }
    pendingClose.current = () => {
      reset();
      onClose();
    };
    setUnsavedOpen(true);
  };

  const confirmDiscard = () => {
    setUnsavedOpen(false);
    dirtyRef.current = false;
    pendingClose.current?.();
    pendingClose.current = null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrors({});
    setDuplicate(null);

    const input = { name, email, company, phone, notes, status };

    if (!isEdit) {
      const existing = getAllClients().find(
        (c) => c.email.trim().toLowerCase() === email.trim().toLowerCase(),
      );
      if (existing) {
        setDuplicate(existing);
        setErrors({ email: "A client with this email already exists." });
        return;
      }
    }

    if (isEdit && clientId) {
      const prev = snapshotRef.current;
      const result = updateClientOptimistic(clientId, input);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSubmitting(true);
      dirtyRef.current = false;
      onUpdated?.(result.client);
      reset();
      onClose();
      if (!nestMode && !skipNavigate) {
        success("Client updated");
      }
      void backgroundSync().then((r) => {
        if (!r.ok && prev) {
          updateClientOptimistic(clientId, prev);
          toastError("Couldn't save client changes. Try again.");
        }
      });
      return;
    }

    const result = addClientOptimistic(input);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    dirtyRef.current = false;
    onCreated?.(result.client);
    reset();
    onClose();

    if (!nestMode && !skipNavigate) {
      router.push(`/clients/${result.client.id}`);
    }

    void backgroundSync().then((r) => {
      if (!r.ok) {
        deleteClientLocal(result.client.id);
        toastError("Couldn't add the client. Try again.");
      }
    });
  };

  return (
    <>
      <Popup
        open={open}
        onClose={requestClose}
        labelledBy="client-form-title"
        align="center"
        panelClassName="w-[min(100vw-2rem,32rem)] bg-card"
      >
        <form onSubmit={onSubmit} noValidate>
          <div className="relative border-b border-border px-6 py-5">
            <div className="absolute right-4 top-4">
              <PopupCloseButton onClick={requestClose} />
            </div>
            <h2
              id="client-form-title"
              className="pr-10 text-lg font-semibold tracking-tight text-ink"
            >
              {isEdit ? "Edit Client" : "Add Client"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update client details. Notes stay private."
                : "Add a client to manage their projects. Notes stay private."}
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <Field id="client-name" label="Name" error={errors.name}>
              <input
                id="client-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                  markDirty();
                }}
                placeholder="e.g. Sarah Johnson"
                aria-invalid={Boolean(errors.name)}
                className={`${inputClass} ${errors.name ? inputErr : inputOk}`}
                autoComplete="off"
                autoFocus
              />
            </Field>

            <Field id="client-email" label="Email" error={errors.email}>
              <input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                  setDuplicate(null);
                  markDirty();
                }}
                placeholder="hello@example.com"
                aria-invalid={Boolean(errors.email)}
                className={`${inputClass} ${errors.email ? inputErr : inputOk}`}
              />
            </Field>

            {duplicate ? (
              <div className="rounded-[8px] border border-border bg-surface px-3.5 py-3 text-sm">
                <p className="text-muted">
                  A client with this email already exists.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onClose();
                    router.push(`/clients/${duplicate.id}`);
                  }}
                  className="mt-1.5 cursor-pointer font-semibold text-ink underline-offset-2 hover:underline"
                >
                  View Client
                </button>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Field id="client-company" label="Company" optional>
                <input
                  id="client-company"
                  type="text"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Acme Studio"
                  className={`${inputClass} ${inputOk}`}
                />
              </Field>
              <Field id="client-phone" label="Phone" optional>
                <input
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    markDirty();
                  }}
                  placeholder="+1 (555) 000-0000"
                  className={`${inputClass} ${inputOk}`}
                />
              </Field>
            </div>

            <Field
              id="client-notes"
              label="Notes"
              optional
              hint="Never visible to the client."
            >
              <textarea
                id="client-notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  markDirty();
                }}
                placeholder="Private notes about this client…"
                rows={3}
                className={`w-full resize-none rounded-[8px] border px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-ink ${inputOk}`}
              />
            </Field>

            {isEdit ? (
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Status</p>
                <div className="flex gap-1.5" role="group" aria-label="Status">
                  {(
                    [
                      { id: "active" as const, label: "Active" },
                      { id: "inactive" as const, label: "Inactive" },
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
            ) : null}

            {errors.form ? (
              <div
                className="rounded-[8px] border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {errors.form}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
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
              {isEdit ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </form>
      </Popup>

      <Popup
        open={unsavedOpen}
        onClose={() => {
          setUnsavedOpen(false);
          pendingClose.current = null;
        }}
        labelledBy="client-discard-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton
              onClick={() => {
                setUnsavedOpen(false);
                pendingClose.current = null;
              }}
            />
          </div>
          <h2
            id="client-discard-title"
            className="pr-10 text-xl font-semibold tracking-tight text-ink"
          >
            Discard changes?
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your client information hasn&apos;t been saved.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setUnsavedOpen(false);
                pendingClose.current = null;
              }}
            >
              Continue Editing
            </Button>
            <Button type="button" variant="danger" onClick={confirmDiscard}>
              Discard
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}
