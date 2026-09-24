import {
  statusPillBaseClass,
  statusPillToneClass,
  type BadgeTone,
} from "@/components/ui/StatusBadge";

/** Human-readable project deadline (schedule — not payment). */
export function deadlineLabelFromIso(iso: string): string {
  if (!iso) return "No deadline";
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "No deadline";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(due);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff <= 14) return `In ${diff} days`;
  if (diff < 0) {
    const n = Math.abs(diff);
    return `${n} day${n === 1 ? "" : "s"} late`;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Semantic deadline meaning — color = category, label = specifics.
 * plain = calendar date → muted text, not a pill.
 */
export type DeadlineTone =
  | "overdue"
  | "attention"
  | "success"
  | "neutral"
  | "plain";

/** Calendar-style labels (e.g. "Sep 30, 2026") — not relative states. */
export function isCalendarDeadlineLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return false;
  if (/^[A-Za-z]{3,9}\s+\d{1,2}(,\s*\d{4})?$/.test(t)) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return true;
  if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(t)) return true;
  return false;
}

function deadlineToneToBadge(tone: Exclude<DeadlineTone, "plain">): BadgeTone {
  switch (tone) {
    case "overdue":
      return "danger";
    case "attention":
      return "warning";
    case "success":
      return "success";
    case "neutral":
      return "neutral";
  }
}

/** Urgency/category from a display label (or raw ISO via deadlineLabelFromIso first). */
export function deadlineToneFromLabel(label: string): DeadlineTone {
  const t = label.trim().toLowerCase();
  if (!t || t === "no deadline" || t === "no deadline set" || t === "paused") {
    return "neutral";
  }
  if (t === "completed") return "success";
  if (/\blate\b/.test(t) || t.includes("overdue")) return "overdue";
  if (t === "today" || t.includes("due today")) return "attention";
  if (t === "tomorrow" || t.includes("due tomorrow")) return "attention";
  if (/^in \d+ days?$/.test(t) || /^due in \d+ days?$/.test(t)) {
    return "neutral";
  }
  if (isCalendarDeadlineLabel(label)) return "plain";
  return "neutral";
}

/** Whether this label should render as a colored pill chip. */
export function deadlineUsesChip(label: string): boolean {
  return deadlineToneFromLabel(label) !== "plain";
}

/**
 * Text color for deadline labels (non-chip contexts).
 * Calendar dates stay muted; relative states use semantic color.
 */
export function deadlineToneClass(label: string): string {
  switch (deadlineToneFromLabel(label)) {
    case "overdue":
      return "font-semibold text-danger";
    case "attention":
      return "font-semibold text-warning";
    case "success":
      return "font-semibold text-success";
    case "neutral":
      return "font-medium text-muted";
    case "plain":
      return "font-medium text-muted";
  }
}

/**
 * Same pill shell + semantic colors as StatusBadge.
 * Returns null for calendar dates — render muted text instead.
 */
export function deadlineToneSurface(label: string): string | null {
  const tone = deadlineToneFromLabel(label);
  if (tone === "plain") return null;
  return `${statusPillBaseClass} ${statusPillToneClass(deadlineToneToBadge(tone))}`;
}
