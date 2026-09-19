/**
 * Shared hover classes — matches sidebar button feel.
 * Uses background + text only. Never changes border-color on hover.
 *
 * Prefer `card-surface-interactive` for clickable cards.
 * Prefer `hover-row` for list rows that contain inner icon buttons
 * (parent wash turns off while hovering the child).
 * For buttons, prefer:
 * - hover-soft
 * - hover-soft-muted
 * - hover-primary
 */

export const hoverSoft = "hover-soft";
export const hoverSoftMuted = "hover-soft hover-soft-muted";
export const hoverPrimary = "hover-primary";
export const hoverRow = "hover-row";
export const cardInteractive = "card-surface-interactive";
