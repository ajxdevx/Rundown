"use client";

import {
  CheckCircle2,
  FileText,
  MessageSquare,
  Wallet,
} from "lucide-react";
import {
  landingBusiness,
  landingClient,
  landingPortal,
  landingProject,
  landingTasks,
} from "@/data/landingDemo";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  StatusBadge,
  projectStatusIcon,
  projectStatusTone,
} from "@/components/ui/StatusBadge";
import { SectionHeader } from "./SectionHeader";

/**
 * Establishes the Business View ↔ Client View storytelling foundation (Step 1).
 * Interactive switching lands in later steps.
 */
export function BusinessClientConcept() {
  return (
    <section
      id="client-portal"
      className="landing-section scroll-mt-24 border-t border-border/60"
      aria-labelledby="portal-concept-heading"
    >
      <div className="landing-shell">
        <SectionHeader
          id="portal-concept-heading"
          eyebrow="Client Portal"
          title="One project. Two experiences."
          description="Your team gets the full workspace. Clients get a focused portal — progress, files, next steps, messages, approvals, and payment."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
                  Business view
                </p>
                <p className="text-sm font-semibold text-ink">
                  {landingBusiness.workspaceName}
                </p>
              </div>
              <StatusBadge
                label={landingProject.status}
                tone={projectStatusTone(landingProject.status)}
                icon={projectStatusIcon(landingProject.status)}
              />
            </header>
            <div className="space-y-4 p-4">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {landingProject.name}
                </h3>
                <p className="text-sm text-muted">{landingProject.client}</p>
              </div>
              <ProgressBar value={landingProject.progress} meta={`${landingProject.progress}%`} />
              <ul className="space-y-2 text-sm">
                {landingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 border-b border-border/70 py-2 last:border-0"
                  >
                    <span className="text-ink">{task.name}</span>
                    <span className="text-xs capitalize text-muted">
                      {task.status.replace("-", " ")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-relaxed text-muted-soft">
                Internal tasks, notes, and private files stay here.
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
                  Client view
                </p>
                <p className="text-sm font-semibold text-ink">
                  {landingClient.name}
                </p>
              </div>
              <StatusBadge label="Portal" tone="lime" />
            </header>
            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {landingPortal.greeting}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {landingPortal.statusMessage}
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-border bg-background p-3">
                <p className="text-xs font-medium text-muted">Next up</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {landingPortal.nextUp.title}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {landingPortal.nextUp.description}
                </p>
              </div>

              <ul className="grid grid-cols-2 gap-2 text-sm">
                <PortalChip icon={FileText} label="Shared files" />
                <PortalChip icon={MessageSquare} label="Messages" />
                <PortalChip icon={CheckCircle2} label="Approvals" />
                <PortalChip icon={Wallet} label="Payment" />
              </ul>

              <p className="text-xs leading-relaxed text-muted-soft">
                Clients never see your internal workspace — only what you share.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function PortalChip({
  icon: Icon,
  label,
}: {
  icon: typeof FileText;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-ink">
      <Icon className="size-3.5 shrink-0 text-muted" aria-hidden />
      <span className="text-xs font-medium">{label}</span>
    </li>
  );
}
