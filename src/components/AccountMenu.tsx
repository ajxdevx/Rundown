"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthProvider";

type AccountMenuProps = {
  open: boolean;
  onClose: () => void;
  displayName: string;
  /** header: below trigger; sidebar: to the left of the avatar */
  placement?: "header" | "sidebar";
};

const PANEL_WIDTH = 240;
const GAP = 10;
const VIEWPORT_PAD = 16;

export default function AccountMenu({
  open,
  onClose,
  displayName,
  placement = "sidebar",
}: AccountMenuProps) {
  const { signOut } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const place = () => {
      const trigger = document.getElementById("account-menu-trigger");
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const rect = trigger.getBoundingClientRect();
      const panelHeight = panel.offsetHeight || 140;

      let left: number;
      let top: number;

      if (placement === "sidebar") {
        left = rect.left - PANEL_WIDTH - GAP;
        top = rect.top;
      } else {
        left = rect.right - PANEL_WIDTH;
        top = rect.bottom + GAP;
      }

      left = Math.min(
        Math.max(left, VIEWPORT_PAD),
        window.innerWidth - PANEL_WIDTH - VIEWPORT_PAD,
      );
      top = Math.min(
        Math.max(top, VIEWPORT_PAD),
        window.innerHeight - panelHeight - VIEWPORT_PAD,
      );

      setPos({ top, left });
    };

    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, placement]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      const trigger = document.getElementById("account-menu-trigger");
      if (trigger?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label="Account"
      style={
        pos
          ? { top: pos.top, left: pos.left }
          : { top: 0, left: 0, visibility: "hidden" }
      }
      className="animate-info-panel fixed z-[100] w-[240px] overflow-hidden rounded-2xl border border-zinc-700/50 bg-[#222222]"
    >
      <div className="border-b border-zinc-700/50 px-4 py-3">
        <p className="truncate text-sm font-semibold text-white">{displayName}</p>
        <p className="mt-0.5 text-xs text-zinc-500">Signed in</p>
      </div>

      <div className="p-1.5">
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-200 hover-soft"
        >
          <User className="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
          Profile
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-200 hover-soft"
        >
          <Settings
            className="size-4 shrink-0 text-zinc-400"
            strokeWidth={1.75}
          />
          Settings
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={signingOut}
          onClick={async () => {
            setSigningOut(true);
            try {
              await signOut();
              onClose();
            } finally {
              setSigningOut(false);
            }
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 hover-soft hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          {signingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
