type ProgressBarProps = {
  value: number;
  label?: string;
  meta?: string;
  className?: string;
};

export function ProgressBar({
  value,
  label,
  meta,
  className = "",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={className}>
      {(label || meta) && (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {label ? (
            <p className="text-sm font-medium text-ink">{label}</p>
          ) : meta ? (
            <p className="min-w-0 truncate text-xs text-muted">{meta}</p>
          ) : (
            <span />
          )}
          {label && meta ? (
            <p className="shrink-0 text-sm text-muted">{meta}</p>
          ) : null}
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
