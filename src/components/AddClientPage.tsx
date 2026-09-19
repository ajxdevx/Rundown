"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  addClientOptimistic,
  deleteClientLocal,
  type ClientFieldErrors,
} from "@/lib/clientsStore";
import { backgroundSync } from "@/lib/optimistic";
import DashboardTopBar from "./DashboardTopBar";
import { useToast } from "./ToastProvider";

const inputClass =
  "h-12 w-full rounded-xl border bg-card px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink disabled:opacity-60";
const inputOk = "border-border";
const inputErr = "border-red-500/70 focus:border-red-400";

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-muted"
      >
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted">optional</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AddClientPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<ClientFieldErrors>({});

  const clearError = (key: keyof ClientFieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = addClientOptimistic({ name, email, company, phone, notes });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    router.push(`/clients/${result.client.id}`);

    void backgroundSync().then((r) => {
      if (!r.ok) {
        deleteClientLocal(result.client.id);
        toastError("Couldn't add the client. Try again.");
        router.replace("/clients/new");
      }
    });
  };

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar
        breadcrumb={[
          { label: "Clients", href: "/clients" },
          { label: "Add Client" },
        ]}
      />

      <div className="w-full flex-1 px-6 py-8 sm:px-8">
        <div className="w-full">
          <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Add a new client
          </h2>
          <p className="mt-2 text-sm text-muted">
            Clients can have multiple projects. Notes stay private.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <Field id="client-name" label="Client name" error={errors.name}>
                <input
                  id="client-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearError("name");
                  }}
                  placeholder="e.g. Sarah Johnson"
                  className={`${inputClass} ${errors.name ? inputErr : inputOk}`}
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
                  }}
                  placeholder="sarah@example.com"
                  className={`${inputClass} ${errors.email ? inputErr : inputOk}`}
                />
              </Field>

              <Field id="client-company" label="Company" optional>
                <input
                  id="client-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className={`${inputClass} ${inputOk}`}
                />
              </Field>

              <Field id="client-phone" label="Phone" optional>
                <input
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`${inputClass} ${inputOk}`}
                />
              </Field>

              <Field id="client-notes" label="Notes" optional>
                <textarea
                  id="client-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes about this client…"
                  rows={3}
                  className={`w-full resize-none rounded-xl border ${inputOk} bg-card px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink`}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Never visible to the client.
                </p>
              </Field>
            </div>

            {errors.form ? (
              <div
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                role="alert"
              >
                {errors.form}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border px-5 text-sm font-semibold text-muted hover-soft"
              >
                <X className="size-4" strokeWidth={1.75} />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl btn-accent px-4 text-sm font-semibold"
              >
                Add Client
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
