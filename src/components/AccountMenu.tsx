"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { mockSignOut } from "@/lib/mockAuth";

type AccountMenuProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  workspaceName?: string;
  /** Anchor element that toggles the menu (outside-click ignore). */
  triggerId?: string;
};

export default function AccountMenu({
  open,
  onClose,
  displayName,
  workspaceName = "Alex Studio",
  triggerId = "account-menu-trigger",
}: AccountMenuProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      const trigger = document.getElementById(triggerId);
      if (trigger?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onClose, triggerId]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label="Account"
      className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-[12px] border border-border bg-card shadow-[var(--shadow-popover)] animate-toast-in"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
        <p className="mt-0.5 text-xs text-muted-soft">{workspaceName}</p>
      </div>

      <div className="p-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => go("/settings/profile")}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium text-ink outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <User className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          Profile
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => go("/settings")}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium text-ink outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <Settings className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          Settings
        </button>
        <div className="my-1 border-t border-border" />
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            mockSignOut();
            router.push("/login");
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium text-danger outline-none hover:bg-danger-soft focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          Log Out
        </button>
      </div>
    </div>
  );
}
