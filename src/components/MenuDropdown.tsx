"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type MenuDropdownOption = {
  id: string;
  label: string;
};

type MenuDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly MenuDropdownOption[];
  /** Shown before the selected label, e.g. "Sort: " */
  labelPrefix?: string;
  /** Invisible spacer used to keep trigger width stable */
  widthLabel?: string;
  align?: "left" | "right";
  "aria-label"?: string;
  className?: string;
  menuClassName?: string;
};

/**
 * Compact single-select used for Sort / filter controls.
 * Matches the Dashboard / Projects / Clients control language.
 */
export default function MenuDropdown({
  value,
  onChange,
  options,
  labelPrefix = "",
  widthLabel,
  align = "right",
  "aria-label": ariaLabel,
  className = "",
  menuClassName = "w-52",
}: MenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);
  const display = selected?.label ?? options[0]?.label ?? "Select";
  const spacer =
    widthLabel ??
    options.reduce(
      (longest, o) =>
        `${labelPrefix}${o.label}`.length > longest.length
          ? `${labelPrefix}${o.label}`
          : longest,
      `${labelPrefix}${display}`,
    );

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-sm font-medium text-muted hover:text-ink"
      >
        <span className="inline-grid text-left">
          <span
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
            aria-hidden
          >
            {spacer}
          </span>
          <span className="col-start-1 row-start-1 whitespace-nowrap">
            {labelPrefix}
            {display}
          </span>
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 opacity-70"
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <ul
          role="listbox"
          className={`absolute z-50 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)] ${menuClassName} ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-sm ${
                  value === opt.id
                    ? "bg-accent font-medium text-ink"
                    : "text-ink hover-soft"
                }`}
              >
                {opt.label}
                {value === opt.id ? (
                  <Check className="size-3.5 text-ink" strokeWidth={2.25} />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
