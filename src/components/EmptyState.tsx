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
    /** main = lime, secondary = outlined */
    variant?: "main" | "secondary";
  };
  secondary?: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  compact = false,
  className = "",
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  const buttonClass = `inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold ${
    action?.variant === "secondary" ? "btn-secondary" : "btn-accent"
  }`;

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 text-center ${
        compact ? "py-10" : "min-h-[40vh] py-16"
      } ${className}`}
    >
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-surface text-ink ${
          compact ? "size-12" : "mb-5 size-14"
        }`}
      >
        <Icon
          className={compact ? "size-5" : "size-6"}
          strokeWidth={1.75}
          aria-hidden
        />
      </div>
      <h3
        className={
          compact
            ? "text-sm font-semibold text-ink"
            : "font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
        }
      >
        {title}
      </h3>
      <p
        className={`mt-1.5 max-w-sm text-sm leading-relaxed text-muted ${
          compact ? "" : "mt-2 max-w-md"
        }`}
      >
        {description}
      </p>
      {action ? (
        action.href ? (
          <Link href={action.href} className={`mt-5 ${buttonClass}`}>
            {ActionIcon ? (
              <ActionIcon className="size-4" strokeWidth={2.25} />
            ) : null}
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={`mt-5 ${buttonClass}`}
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
        className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
      >
        Clear Search
      </button>
    </div>
  );
}
