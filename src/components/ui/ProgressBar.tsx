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
  const done = pct >= 100;

  return (
    <div className={className}>
      {(label || meta) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? (
            <p className="text-sm font-medium text-ink">{label}</p>
          ) : (
            <span />
          )}
          {meta ? <p className="text-sm text-muted">{meta}</p> : null}
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            done ? "bg-success" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {done ? (
        <p className="mt-2 text-xs font-medium text-success">Completed</p>
      ) : null}
    </div>
  );
}
