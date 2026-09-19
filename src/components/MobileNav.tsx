"use client";

import {
  Activity,
  Bell,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mockSignOut } from "@/lib/mockAuth";

const TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
] as const;

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (moreRef.current?.contains(e.target as Node)) return;
      setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  const moreActive =
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/billing") ||
    pathname.startsWith("/activity");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
      <div className="relative flex h-14 items-stretch">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? "text-ink" : "text-muted"
              }`}
            >
              <tab.icon
                className={`size-5 ${active ? "text-ink" : ""}`}
                strokeWidth={active ? 2 : 1.75}
              />
              {tab.label}
            </Link>
          );
        })}

        <div className="relative flex flex-1" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              moreOpen || moreActive ? "text-ink" : "text-muted"
            }`}
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
            More
          </button>

          {moreOpen ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+8px)] right-2 w-52 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)]"
            >
                  {(
                [
                  { href: "/notifications", label: "Notifications", icon: Bell },
                  { href: "/activity", label: "Activity", icon: Activity },
                  { href: "/billing", label: "Billing", icon: CreditCard },
                  { href: "/settings", label: "Settings", icon: Settings },
                  { href: "/settings", label: "Account", icon: User },
                ] as const
              ).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-medium text-ink hover-soft"
                >
                  <item.icon className="size-4 text-muted" strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  mockSignOut();
                  router.push("/login");
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                Log Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
