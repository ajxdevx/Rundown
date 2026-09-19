"use client";

import { Eye, EyeOff } from "lucide-react";

type ClientVisibleToggleProps = {
  visible: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
};

export default function ClientVisibleToggle({
  visible,
  onChange,
  compact = false,
}: ClientVisibleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visible}
      aria-label={visible ? "Visible to client" : "Only you can see this"}
      onClick={() => onChange(!visible)}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2 py-1 text-xs font-medium transition-colors duration-150 ${
        visible
          ? "text-success hover:bg-success-soft"
          : "text-muted hover:bg-surface-hover"
      }`}
    >
      {visible ? (
        <Eye className="size-3.5 shrink-0" strokeWidth={1.75} />
      ) : (
        <EyeOff className="size-3.5 shrink-0" strokeWidth={1.75} />
      )}
      {!compact && (
        <span>{visible ? "Visible to client" : "Only you can see this"}</span>
      )}
    </button>
  );
}
