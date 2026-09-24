import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDollarSign,
  CirclePause,
  CirclePlay,
  Clock,
  LoaderCircle,
  XCircle,
} from "lucide-react";

/**
 * Status badges — color = semantic category, label = specific state.
 * Lime → Active / In Progress
 * Green → Success / Completed / Paid
 * Amber → Attention / Due / Partial / On Hold
 * Red → Problem / Overdue / Failed
 * Blue → Processing / Information
 * Gray → Neutral / Draft / To Do / Inactive / Archived
 */
export type BadgeTone =
  | "neutral"
  | "active"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "lime";

const toneClass: Record<BadgeTone, string> = {
  /* Lime — Active / In Progress */
  active:
    "border-accent-border bg-accent-soft text-accent-fg",
  lime: "border-accent-border bg-accent-soft text-accent-fg",
  /* Green — Completed / Paid / Success */
  success: "border-success-border bg-success-soft text-success",
  /* Amber — Due / Attention / On Hold */
  warning: "border-warning-border bg-warning-soft text-warning",
  /* Red — Overdue / Failed / Problem */
  danger: "border-danger-border bg-danger-soft text-danger",
  /* Blue — Processing / Information */
  info: "border-info-border bg-info-soft text-info",
  /* Gray — Draft / To Do / Inactive / Neutral */
  neutral: "border-neutral-border bg-neutral-soft text-neutral-fg",
};

/** Shared pill shell — status badges and due chips use the same shape. */
export const statusPillBaseClass =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-tight";

export function statusPillToneClass(tone: BadgeTone): string {
  return toneClass[tone];
}

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Outline icon shown before the label. Prefer this over the old dot. */
  icon?: LucideIcon;
  /** Legacy color-only indicator. Ignored when `icon` is set. */
  dot?: boolean;
  className?: string;
};

export function StatusBadge({
  label,
  tone = "neutral",
  icon: Icon,
  dot = false,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`${statusPillBaseClass} ${toneClass[tone]} ${className}`}
    >
      {Icon ? (
        <Icon className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
      ) : dot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />
      ) : null}
      {label}
    </span>
  );
}

export function projectStatusTone(status: string): BadgeTone {
  switch (status) {
    case "active":
    case "review":
      return "active";
    case "on-hold":
    case "on hold":
      return "warning";
    case "completed":
      return "success";
    case "draft":
    case "archived":
    case "inactive":
      return "neutral";
    default:
      return "neutral";
  }
}

export function projectStatusIcon(status: string): LucideIcon {
  switch (status) {
    case "active":
    case "review":
      return CirclePlay;
    case "on-hold":
    case "on hold":
      return CirclePause;
    case "completed":
      return CircleCheck;
    case "draft":
      return CircleDashed;
    case "archived":
      return Archive;
    default:
      return CircleDashed;
  }
}

export function paymentStatusTone(status: string): BadgeTone {
  switch (status) {
    case "paid":
      return "success";
    case "partial":
    case "pending":
    case "due":
      return "warning";
    case "overdue":
    case "failed":
      return "danger";
    case "processing":
    case "sent":
      return "info";
    default:
      return "neutral";
  }
}

export function paymentStatusIcon(status: string): LucideIcon {
  switch (status) {
    case "paid":
      return CircleCheck;
    case "partial":
      return CircleDollarSign;
    case "pending":
    case "due":
      return CircleDollarSign;
    case "overdue":
      return CircleAlert;
    case "processing":
    case "sent":
      return LoaderCircle;
    case "failed":
      return XCircle;
    default:
      return Clock;
  }
}

/** Shared payment status copy — use everywhere (Projects, Overview, Tasks invoices). */
export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "due":
    case "pending":
      return "Due";
    case "partial":
      return "Partial";
    case "overdue":
      return "Overdue";
    case "processing":
    case "sent":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function taskStatusTone(status: string): BadgeTone {
  switch (status) {
    case "in-progress":
    case "in progress":
      return "active";
    case "completed":
      return "success";
    case "todo":
    case "to do":
    default:
      return "neutral";
  }
}

export function taskStatusIcon(status: string): LucideIcon {
  switch (status) {
    case "in-progress":
    case "in progress":
      return CirclePlay;
    case "completed":
      return CircleCheck;
    case "todo":
    case "to do":
    default:
      return CircleDashed;
  }
}

export function taskStatusLabel(status: string): string {
  switch (status) {
    case "in-progress":
    case "in progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "todo":
    case "to do":
    default:
      return "To Do";
  }
}
