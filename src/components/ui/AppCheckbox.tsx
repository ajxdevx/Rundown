/**
 * App checkbox — same language as dashboard mission checks:
 * lime fill + ink stroke when checked; strong border when empty.
 */
export function AppCheckbox({
  checked,
  drawn = false,
  size = "md",
  className = "",
}: {
  checked: boolean;
  /** Replay the mission draw animation when becoming checked. */
  drawn?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const box =
    size === "sm"
      ? "size-4 rounded-[4px] border-2"
      : "size-5 rounded-[5px] border-2";
  const icon = size === "sm" ? "size-3" : "size-3.5";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${box} ${
        checked
          ? "border-accent bg-accent"
          : "border-border-strong bg-transparent"
      } ${className}`}
      aria-hidden
    >
      {checked ? (
        <svg
          viewBox="0 0 16 16"
          className={icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3.5 8.2 L6.6 11.2 L12.5 4.8"
            className={drawn ? "mission-check-draw" : undefined}
            stroke="var(--ink)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}
