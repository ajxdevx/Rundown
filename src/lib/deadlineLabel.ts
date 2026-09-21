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

export type DeadlineTone =
  | "overdue"
  | "today"
  | "tomorrow"
  | "future"
  | "none";

/** Urgency from a display label (or raw ISO via deadlineLabelFromIso first). */
export function deadlineToneFromLabel(label: string): DeadlineTone {
  const t = label.trim().toLowerCase();
  if (!t || t === "no deadline" || t === "no deadline set" || t === "paused") {
    return "none";
  }
  // "3 days late", legacy "overdue by…", or payment-style "overdue"
  if (/\blate\b/.test(t) || t.includes("overdue")) return "overdue";
  if (t === "today" || t.includes("due today")) return "today";
  if (t === "tomorrow" || t.includes("due tomorrow")) return "tomorrow";
  // "In N days", calendar dates, legacy "Due in…" → later
  return "future";
}

/**
 * Text color for deadline labels.
 * late → red; today → orange; tomorrow → yellow; later → green; none → muted.
 */
export function deadlineToneClass(label: string): string {
  switch (deadlineToneFromLabel(label)) {
    case "overdue":
      return "font-semibold text-danger";
    case "today":
      return "font-semibold text-orange";
    case "tomorrow":
      return "font-semibold text-yellow";
    case "future":
      return "font-semibold text-success";
    case "none":
      return "font-medium text-muted-soft";
  }
}

/**
 * Deadline chips by urgency:
 * late → red, today → orange, tomorrow → yellow, later → green, none → muted.
 * Uses dedicated orange/yellow tokens — not warning amber.
 */
export function deadlineToneSurface(label: string): string {
  switch (deadlineToneFromLabel(label)) {
    case "overdue":
      return "bg-danger-soft text-danger";
    case "today":
      return "bg-orange-soft text-orange";
    case "tomorrow":
      return "bg-yellow-soft text-yellow";
    case "future":
      return "bg-success-soft text-success";
    case "none":
      return "bg-surface-strong text-muted";
  }
}
