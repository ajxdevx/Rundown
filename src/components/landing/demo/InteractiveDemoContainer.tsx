"use client";

import { useMemo } from "react";
import { ToastProvider } from "@/components/ToastProvider";
import { JoinWaitlistButton } from "../waitlist";
import { ixNav } from "../motion/interaction";
import { DemoClients } from "./DemoClients";
import { DemoClientPortal } from "./DemoClientPortal";
import { DemoCreateProjectModal } from "./DemoCreateProjectModal";
import { DemoDashboard } from "./DemoDashboard";
import { DemoProjectDetail } from "./DemoProjectDetail";
import { DemoProjects } from "./DemoProjects";
import { DemoSidebar } from "./DemoSidebar";
import { DemoStateProvider, useDemoState } from "./DemoStateProvider";

function DemoShellInner() {
  const { view, navigate } = useDemoState();

  const content = useMemo(() => {
    switch (view) {
      case "dashboard":
        return <DemoDashboard />;
      case "projects":
        return <DemoProjects />;
      case "clients":
        return <DemoClients />;
      case "project":
        return <DemoProjectDetail />;
      case "portal":
        return <DemoClientPortal />;
      default:
        return <DemoDashboard />;
    }
  }, [view]);

  return (
    <div className="relative flex h-[min(76vh,720px)] min-h-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[0_16px_48px_rgba(17,17,17,0.06)]">
      {view !== "portal" ? (
        <DemoSidebar className="hidden sm:flex" />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {view !== "portal" ? (
          <div className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 sm:hidden">
            {(
              [
                ["dashboard", "Dashboard"],
                ["projects", "Projects"],
                ["clients", "Clients"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`shrink-0 ${ixNav(
                  view === id || (id === "projects" && view === "project"),
                )} px-2.5 py-1.5`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="min-h-0 flex-1">
          <div key={view} className="landing-demo-view h-full min-h-0">
            {content}
          </div>
        </div>
      </div>

      <DemoCreateProjectModal />
    </div>
  );
}

export function InteractiveDemoContainer({
  id = "product",
}: {
  id?: string;
}) {
  return (
    <section
      id={id}
      className="landing-section scroll-mt-24 border-t border-border/60"
      aria-labelledby={`${id}-heading`}
    >
      <div className="landing-shell">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-muted sm:text-base">
            Product
          </p>
          <h2
            id={`${id}-heading`}
            className="mt-2 font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Experience Dueso
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Explore the workspace, then open the client portal from a project.
            Complete tasks, pay invoices, and message as the client — everything
            stays in sync, all local to this page.
          </p>
        </div>

        <div className="mt-12">
          <ToastProvider>
            <DemoStateProvider>
              <DemoShellInner />
            </DemoStateProvider>
          </ToastProvider>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            Ready to use this for your own clients?
          </p>
          <JoinWaitlistButton source="product_demo" size="sm" />
        </div>
      </div>
    </section>
  );
}

export { DemoStateProvider, useDemoState };
