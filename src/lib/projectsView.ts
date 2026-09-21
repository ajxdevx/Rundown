export type ProjectsViewMode = "list" | "grid";

export const PROJECTS_VIEW_COOKIE = "dueso-projects-view";
export const PROJECTS_VIEW_KEY = "dueso:projects-view";

/**
 * Stable trigger spacers for projects filters.
 * Must stay identical in live UI + ProjectsPageSkeleton to avoid layout jump.
 */
export const PROJECTS_FILTER_WIDTHS = {
  payments: "All payments",
  /** Long enough for seed client names + "All clients" / "N selected". */
  clients: "Verde Capital",
  sort: "Sort: Deadline soonest",
} as const;

export function parseProjectsViewMode(
  value: string | null | undefined,
): ProjectsViewMode {
  return value === "list" ? "list" : "grid";
}
