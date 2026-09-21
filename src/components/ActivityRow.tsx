"use client";

import {
  Building2,
  CheckSquare,
  CreditCard,
  FileText,
  FolderKanban,
  Globe,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  ActivityCategory,
  ActivityEvent,
} from "@/data/activityMock";
import { useToastOptional } from "./ToastProvider";

export function activityIcon(category: ActivityCategory): LucideIcon {
  switch (category) {
    case "projects":
      return FolderKanban;
    case "clients":
      return Users;
    case "tasks":
      return CheckSquare;
    case "files":
      return FileText;
    case "invoices":
      return CreditCard;
    case "messages":
      return MessageSquare;
    case "portal":
      return Globe;
    case "workspace":
      return Building2;
    default:
      return FolderKanban;
  }
}

export function moneyToneClass(status?: string | null) {
  switch (status) {
    case "paid":
      return "text-success";
    case "due":
      return "text-warning";
    case "overdue":
    case "failed":
      return "text-danger";
    case "processing":
      return "text-info";
    default:
      return "text-ink";
  }
}

type ActivityRowProps = {
  item: ActivityEvent;
  /** Compact density for dashboard / detail side panels */
  compact?: boolean;
  onNavigate?: (item: ActivityEvent) => void;
};

export default function ActivityRow({
  item,
  compact = false,
  onNavigate,
}: ActivityRowProps) {
  const router = useRouter();
  const toast = useToastOptional();
  const Icon = activityIcon(item.category);

  const handleClick = () => {
    if (item.targetUnavailable) {
      toast?.error("This item is no longer available.");
      return;
    }
    if (onNavigate) {
      onNavigate(item);
      return;
    }
    router.push(item.href);
  };

  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${item.description}. ${item.context}. ${item.time}.`}
        title={new Date(item.createdAt).toLocaleString()}
        className={`flex w-full cursor-pointer items-start gap-3 text-left outline-none transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/15 ${
          compact ? "px-4 py-3 sm:px-5" : "px-4 py-3.5 sm:px-5"
        }`}
      >
        <span
          className={`mt-0.5 flex shrink-0 items-center justify-center rounded-[8px] bg-surface text-muted ${
            compact ? "size-8" : "size-9"
          }`}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink">{item.description}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span className="truncate">{item.context}</span>
            {item.amount ? (
              <>
                <span aria-hidden>·</span>
                <span
                  className={`font-medium ${moneyToneClass(item.paymentStatus)}`}
                >
                  {item.amount}
                </span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span className="text-muted-soft">{item.time}</span>
          </span>
        </span>
      </button>
    </li>
  );
}
