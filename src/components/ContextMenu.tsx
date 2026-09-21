"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

export type ContextMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  dividerBefore?: boolean;
  hidden?: boolean;
};

type ContextMenuProps = {
  open: boolean;
  onClose: () => void;
  items: readonly ContextMenuItem[];
  onAction: (id: string) => void;
  /** Fixed positioning (row action menus). When omitted, renders absolutely under the trigger. */
  position?: { x: number; y: number } | null;
  widthClass?: string;
  /** Extra bottom clearance when clamping fixed menus */
  clampHeight?: number;
  children?: ReactNode;
};

/**
 * Shared context / overflow menu — same shell as Dashboard project & invoice menus.
 */
export default function ContextMenu({
  open,
  onClose,
  items,
  onAction,
  position,
  widthClass = "w-52",
  clampHeight = 280,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fixed = position != null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  if (fixed && !position) return null;

  const visible = items.filter((item) => !item.hidden);
  if (visible.length === 0) return null;

  const style =
    fixed && position
      ? {
          top: Math.min(
            position.y,
            typeof window !== "undefined"
              ? window.innerHeight - clampHeight
              : position.y,
          ),
          left: Math.min(
            position.x,
            typeof window !== "undefined"
              ? window.innerWidth - 220
              : position.x,
          ),
        }
      : undefined;

  return (
    <div
      ref={ref}
      role="menu"
      style={style}
      className={
        fixed
          ? `fixed z-[80] overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)] ${widthClass}`
          : `absolute right-0 top-full z-40 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)] ${widthClass}`
      }
    >
      {visible.map((item) => (
        <div key={item.id}>
          {item.dividerBefore || item.danger ? (
            <div className="my-1 border-t border-border" />
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm font-medium ${
              item.danger
                ? "text-danger hover:bg-danger-soft"
                : "text-ink hover-soft"
            }`}
          >
            {item.icon ? (
              <item.icon className="size-4 opacity-70" strokeWidth={1.75} />
            ) : null}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
