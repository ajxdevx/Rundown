/**
 * Shared interaction class names for the landing page + demo shell.
 * Keep visual language consistent — don't invent one-off hover styles.
 */

/** Primary surface row (project cards, list items) */
export const ixRow =
  "landing-ix-row rounded-[var(--radius-md)] border border-border bg-card text-left transition-[background-color,border-color] duration-150 ease-out hover:bg-surface-hover hover:border-border-strong";

/** Icon / tertiary control */
export const ixIcon =
  "landing-ix-icon inline-flex items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink";

/** Text / tertiary link */
export const ixLink =
  "landing-ix-link text-muted transition-colors duration-150 hover:text-ink";

/** Tab control (project + portal) */
export const ixTab = (active: boolean) =>
  `landing-ix-tab shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors duration-150 ${
    active
      ? "border-ink text-ink"
      : "border-transparent text-muted hover:text-ink"
  }`;

/** Nav pill / chip — sits on app background */
export const ixNav = (active: boolean) =>
  `landing-ix-nav flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors duration-150 ${
    active
      ? "bg-accent text-ink"
      : "text-muted hover:bg-bg-hover hover:text-ink"
  }`;

/** Selected list item */
export const ixSelect = (active: boolean) =>
  `flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left transition-colors duration-150 ${
    active ? "bg-accent text-ink" : "hover:bg-surface-hover"
  }`;
