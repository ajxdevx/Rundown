"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  secondary?: ReactNode;
  compact?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  compact = false,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  const buttonClass =
    "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl btn-accent px-4 text-sm font-semibold";

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        compact ? "py-12" : "min-h-[40vh] py-16"
      }`}
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-surface text-ink">
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
      <h3 className="font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? (
        action.href ? (
          <Link href={action.href} className={`mt-6 ${buttonClass}`}>
            {ActionIcon ? (
              <ActionIcon className="size-4" strokeWidth={2.25} />
            ) : null}
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={`mt-6 ${buttonClass}`}
          >
            {ActionIcon ? (
              <ActionIcon className="size-4" strokeWidth={2.25} />
            ) : null}
            {action.label}
          </button>
        )
      ) : null}
      {secondary ? <div className="mt-3">{secondary}</div> : null}
    </div>
  );
}

export function SearchEmpty({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-ink">No results</h3>
      <p className="mt-2 text-sm text-muted">
        We couldn&apos;t find anything matching &ldquo;{query}&rdquo;.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft"
      >
        Clear Search
      </button>
    </div>
  );
}
