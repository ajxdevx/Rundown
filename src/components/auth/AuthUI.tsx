"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Dueso"
            width={40}
            height={40}
            className="size-10 object-contain"
            unoptimized
          />
          <span className="font-[family-name:var(--font-brand)] text-lg font-bold tracking-tight text-ink">
            Dueso
          </span>
        </Link>

        <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        ) : null}

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const authInputClass =
  "h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink disabled:opacity-60";

export const authInputError = "border-red-400 focus:border-red-400";

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  autoComplete = "current-password",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${authInputClass} pr-12 ${error ? authInputError : ""}`}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted hover-soft"
      >
        {show ? (
          <EyeOff className="size-4" strokeWidth={1.75} />
        ) : (
          <Eye className="size-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

export function AuthButton({
  children,
  loading,
  type = "submit",
  variant = "primary",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
  variant?: "primary" | "secondary" | "google";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "relative inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  const styles =
    variant === "primary"
      ? "btn-accent"
      : variant === "google"
        ? "border border-border bg-card text-ink hover-soft"
        : "border border-border bg-card text-ink hover-soft";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles}`}
    >
      <span className={loading ? "opacity-0" : ""}>{children}</span>
      {loading ? (
        <Loader2
          className="absolute size-5 animate-spin"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        OR
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthFormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
      role="alert"
    >
      {message}
    </div>
  );
}

export function OnboardingProgress({
  step,
  total = 3,
}: {
  step: number;
  total?: number;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-medium text-muted">
        Step {step} of {total}
      </p>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-ink" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
