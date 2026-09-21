"use client";

import { FolderX, Lock, LogIn } from "lucide-react";
import Link from "next/link";

function Shell({
  icon: Icon,
  title,
  description,
  children,
  standalone = false,
}: {
  icon: typeof FolderX;
  title: string;
  description: string;
  children?: React.ReactNode;
  standalone?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-20 text-center ${
        standalone ? "min-h-screen bg-background" : "min-h-[60vh]"
      }`}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-surface text-ink">
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
      <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {description}
      </p>
      {children ? (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectNotFound() {
  return (
    <Shell
      icon={FolderX}
      title="Project not found"
      description="This project may have been deleted or you may not have access to it."
    >
      <Link
        href="/projects"
        className="inline-flex h-11 cursor-pointer items-center rounded-[8px] btn-accent px-5 text-sm font-semibold"
      >
        Back to Projects
      </Link>
    </Shell>
  );
}

export function PortalNotFound() {
  return (
    <Shell
      icon={FolderX}
      title="Project not found"
      description="This project may have been deleted or the link may no longer be available."
      standalone
    >
      <a
        href="https://dueso.app"
        className="inline-flex h-11 cursor-pointer items-center rounded-[8px] btn-accent px-5 text-sm font-semibold"
      >
        Learn about Dueso
      </a>
    </Shell>
  );
}

export function PortalUnavailable() {
  return (
    <Shell
      icon={Lock}
      title="This portal is unavailable"
      description="The project owner has temporarily disabled access to this client portal."
      standalone
    />
  );
}

export function PermissionDenied({
  resource = "this project",
  backHref = "/projects",
  backLabel = "Back to Projects",
}: {
  resource?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <Shell
      icon={Lock}
      title={`You don't have access to ${resource}`}
      description="Ask the owner for access, or return to your workspace."
    >
      <Link
        href={backHref}
        className="inline-flex h-11 cursor-pointer items-center rounded-[8px] btn-accent px-5 text-sm font-semibold"
      >
        {backLabel}
      </Link>
    </Shell>
  );
}

export function SessionExpired() {
  return (
    <Shell
      icon={LogIn}
      title="Your session has expired"
      description="Please sign in again to continue."
      standalone
    >
      <Link
        href="/login"
        className="inline-flex h-11 cursor-pointer items-center rounded-[8px] btn-accent px-5 text-sm font-semibold"
      >
        Log in
      </Link>
    </Shell>
  );
}

export function LocalErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-card px-4 py-3"
    >
      <p className="text-sm text-ink">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
