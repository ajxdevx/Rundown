"use client";

import {
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  RotateCcw,
  Users,
} from "lucide-react";
import Image from "next/image";
import type { DemoView } from "@/data/demoWorkspace";
import { ixNav } from "../motion/interaction";
import { useDemoState } from "./DemoStateProvider";

const NAV: { view: DemoView; label: string; icon: typeof LayoutDashboard }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "projects", label: "Projects", icon: FolderKanban },
  { view: "clients", label: "Clients", icon: Users },
];

export function DemoSidebar({ className = "" }: { className?: string }) {
  const { workspace, view, navigate, resetDemo, selectedProject, openPortal } =
    useDemoState();

  const activeView =
    view === "project" || view === "portal" ? "projects" : view;

  return (
    <aside
      className={`flex w-[200px] shrink-0 flex-col border-r border-border bg-background ${className}`}
      aria-label="Demo navigation"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Image
          src="/logo.png"
          alt=""
          width={22}
          height={22}
          className="size-[22px] object-contain"
          unoptimized
        />
        <span className="text-sm font-semibold tracking-tight text-ink">
          Dueso
        </span>
      </div>

      <div className="border-b border-border px-3 py-3">
        <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
          Workspace
        </p>
        <div className="rounded-md border border-border bg-card px-2.5 py-2">
          <p className="truncate text-xs font-medium text-ink">
            {workspace.name}
          </p>
          <p className="truncate text-[10px] text-muted-soft">Demo workspace</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ view: itemView, label, icon: Icon }) => {
          const active = activeView === itemView;
          return (
            <button
              key={itemView}
              type="button"
              onClick={() => navigate(itemView)}
              className={ixNav(active)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}

        {selectedProject ? (
          <button
            type="button"
            onClick={() => openPortal(selectedProject.id)}
            className={`mt-1 ${ixNav(view === "portal")}`}
          >
            <CircleDollarSign className="size-3.5 shrink-0" aria-hidden />
            Client Portal
          </button>
        ) : null}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={resetDemo}
          className="landing-ix-icon flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-muted hover:bg-bg-hover hover:text-ink"
        >
          <RotateCcw className="size-3.5 shrink-0" aria-hidden />
          Reset Demo
        </button>
      </div>
    </aside>
  );
}
