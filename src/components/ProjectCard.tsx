"use client";

import { Clock, Copy, Link2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { PaymentStatus, ProjectStatus } from "@/data/dashboardMock";
import { deadlineToneSurface } from "@/lib/deadlineLabel";
import { ProgressBar } from "./ui/ProgressBar";
import {
  paymentStatusIcon,
  paymentStatusLabel,
  paymentStatusTone,
  projectStatusIcon,
  projectStatusTone,
  StatusBadge,
} from "./ui/StatusBadge";

export type ProjectCardData = {
  id: string;
  slug: string;
  name: string;
  client: string;
  progress: number;
  currentTask: string;
  deadlineLabel: string;
  value: number;
  paid: number;
  paymentStatus: PaymentStatus;
  status: ProjectStatus;
};

type ProjectCardProps = {
  project: ProjectCardData;
  onOpen: () => void;
  onCopyLink: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Top-right overflow control (⋯ button + optional dropdown). */
  menu: ReactNode;
  /** Tighter layout for dashboard lists. */
  compact?: boolean;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyToneClass(status?: string | null) {
  switch (status) {
    case "paid":
    case "collected":
      return "text-success";
    case "due":
    case "pending":
    case "partial":
    case "outstanding":
      return "text-warning";
    case "overdue":
    case "failed":
      return "text-danger";
    case "processing":
    case "sent":
      return "text-info";
    default:
      return "text-ink";
  }
}

function paymentLabel(status: PaymentStatus) {
  return paymentStatusLabel(status);
}

function projectLabel(status: ProjectStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "on-hold":
      return "On Hold";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    case "review":
      return "Active";
  }
}

function FundLine({
  value,
  paid,
  remaining,
  payStatus,
  compact,
}: {
  value: number;
  paid: number;
  remaining: number;
  payStatus: PaymentStatus;
  compact?: boolean;
}) {
  const paidTone = moneyToneClass("paid");
  const leftTone =
    remaining <= 0
      ? moneyToneClass("paid")
      : moneyToneClass(payStatus);

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <span className="font-medium text-ink">{formatMoney(value)}</span>
      <span className="text-muted-soft" aria-hidden>
        ·
      </span>
      <span className={`font-medium ${paidTone}`}>
        {formatMoney(paid)} paid
      </span>
      <span className="text-muted-soft" aria-hidden>
        ·
      </span>
      <span className={`font-medium ${leftTone}`}>
        {formatMoney(remaining)} remaining
      </span>
    </div>
  );
}

function MetaCell({
  label,
  value,
  valueClassName = "text-ink",
  labelClassName = "text-muted-soft",
}: {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`text-[11px] font-medium ${labelClassName}`}>{label}</p>
      <p className={`mt-0.5 truncate text-sm font-medium ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function DeadlineChip({
  label,
  compact,
}: {
  label: string;
  compact?: boolean;
}) {
  const surface = deadlineToneSurface(label);
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 ${
        compact ? "text-[11px]" : "text-xs"
      }`}
    >
      <span className="shrink-0 font-medium text-muted-soft">Due:</span>
      {surface ? (
        <span className={surface}>
          <Clock className="size-3 shrink-0" strokeWidth={2.25} aria-hidden />
          <span className="truncate">{label}</span>
        </span>
      ) : (
        <span className="truncate font-medium text-muted">{label}</span>
      )}
    </span>
  );
}

export default function ProjectCard({
  project,
  onOpen,
  onCopyLink,
  onContextMenu,
  menu,
  compact = false,
}: ProjectCardProps) {
  const payKey =
    project.paymentStatus === "partial" ? "due" : project.paymentStatus;
  const remaining = Math.max(0, project.value - project.paid);

  return (
    <li
      role="link"
      tabIndex={0}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest("button") ||
          target.closest("a") ||
          target.closest("[role='menu']")
        ) {
          return;
        }
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onContextMenu={onContextMenu}
      className={`card-surface-interactive flex cursor-pointer flex-col ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate font-semibold text-ink ${
              compact ? "text-sm" : "text-[15px]"
            }`}
          >
            {project.name}
          </h3>
          <p
            className={`flex min-w-0 items-baseline gap-1.5 truncate ${
              compact ? "mt-0.5 text-xs" : "mt-1 text-sm"
            }`}
          >
            <span className="shrink-0 font-medium text-muted-soft">
              Client:
            </span>
            <span className="truncate text-muted">{project.client}</span>
          </p>
          <div
            className={`flex flex-wrap items-center gap-1.5 ${
              compact ? "mt-2" : "mt-2.5"
            }`}
          >
            <StatusBadge
              label={projectLabel(project.status)}
              tone={projectStatusTone(project.status)}
              icon={projectStatusIcon(project.status)}
            />
            <StatusBadge
              label={paymentLabel(payKey)}
              tone={paymentStatusTone(payKey)}
              icon={paymentStatusIcon(payKey)}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="relative">{menu}</div>
          <DeadlineChip label={project.deadlineLabel} compact={compact} />
        </div>
      </div>

      <ProgressBar
        className={compact ? "mt-2.5" : "mt-3.5"}
        value={project.progress}
        label={compact ? undefined : "Progress"}
        meta={`${project.progress}%`}
      />

      {compact ? (
        <div className="mt-2.5">
          <FundLine
            value={project.value}
            paid={project.paid}
            remaining={remaining}
            payStatus={payKey}
            compact
          />
        </div>
      ) : (
        <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <MetaCell label="Value" value={formatMoney(project.value)} />
          <MetaCell
            label="Paid"
            value={formatMoney(project.paid)}
            labelClassName={moneyToneClass("paid")}
            valueClassName={moneyToneClass("paid")}
          />
          <MetaCell
            label="Remaining"
            value={formatMoney(remaining)}
            labelClassName={
              remaining <= 0
                ? moneyToneClass("paid")
                : moneyToneClass(payKey)
            }
            valueClassName={
              remaining <= 0
                ? moneyToneClass("paid")
                : moneyToneClass(payKey)
            }
          />
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-3 border-t border-border ${
          compact ? "mt-2.5 pt-2.5" : "mt-3.5 pt-3"
        }`}
      >
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-soft">
          <Link2 className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="truncate">Client portal</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Copy portal link"
            onClick={(e) => {
              e.stopPropagation();
              onCopyLink();
            }}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-3 font-medium text-muted hover-soft ${
              compact ? "h-8 text-xs" : "h-9 text-sm"
            }`}
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            Copy link
          </button>
          <Link
            href={`/projects/${project.slug}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex cursor-pointer items-center rounded-[8px] btn-accent px-3.5 font-medium ${
              compact ? "h-8 text-xs" : "h-9 text-sm"
            }`}
          >
            Open
          </Link>
        </div>
      </div>
    </li>
  );
}
