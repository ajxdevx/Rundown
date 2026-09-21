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

type BadgeTone =
  | "neutral"
  | "active"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "lime";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-surface-strong text-muted",
  active: "bg-accent-soft text-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  lime: "bg-accent-soft text-ink",
};

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
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-tight ${toneClass[tone]} ${className}`}
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
