/** Reserved / already-taken portal slugs (mock uniqueness). */
const TAKEN_SLUGS = new Set([
  "acme-website",
  "acme-website-redesign",
]);

export function slugifyProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

/**
 * Generate a unique portal slug from a project name.
 * If base is taken, appends -2, -3, …
 */
export function uniqueProjectSlug(
  name: string,
  taken: Iterable<string> = TAKEN_SLUGS,
): string {
  const takenSet = new Set(
    [...taken].map((s) => s.toLowerCase()).filter(Boolean),
  );
  const base = slugifyProjectName(name) || "project";

  if (!takenSet.has(base)) return base;

  let n = 2;
  while (takenSet.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function markSlugTaken(slug: string) {
  TAKEN_SLUGS.add(slug.toLowerCase());
}

export function getTakenSlugs(): string[] {
  return [...TAKEN_SLUGS];
}
