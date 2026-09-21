"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useDemoState } from "./DemoStateProvider";
import { DemoTopBar } from "./DemoTopBar";
import { ixRow, ixSelect } from "../motion/interaction";

export function DemoClients() {
  const {
    clients,
    projects,
    selectedClientId,
    openClient,
    openProject,
  } = useDemoState();

  const selected =
    clients.find((c) => c.id === selectedClientId) ?? clients[0] ?? null;
  const clientProjects = selected
    ? projects.filter((p) => p.clientId === selected.id)
    : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DemoTopBar title="Clients" context="Workspace" />
      <div className="grid min-h-0 flex-1 lg:grid-cols-[240px_1fr]">
        <ul className="overflow-y-auto border-b border-border p-2 lg:border-b-0 lg:border-r">
          {clients.map((client) => {
            const active = selected?.id === client.id;
            return (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => openClient(client.id)}
                  className={ixSelect(active)}
                  aria-current={active ? "true" : undefined}
                >
                  <Avatar name={client.contactName} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-ink">
                      {client.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {client.contactName}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="min-h-0 overflow-y-auto p-3 sm:p-4">
          {selected ? (
            <>
              <div className="flex items-start gap-3">
                <Avatar name={selected.contactName} size="lg" />
                <div>
                  <h3 className="text-base font-semibold text-ink">
                    {selected.name}
                  </h3>
                  <p className="text-sm text-muted">{selected.contactName}</p>
                  <p className="mt-1 text-xs text-muted-soft">{selected.email}</p>
                </div>
              </div>

              <h4 className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft">
                Projects
              </h4>
              <ul className="mt-2 space-y-2">
                {clientProjects.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => openProject(project.id)}
                      className={`${ixRow} flex w-full items-center justify-between gap-3 px-3 py-2.5`}
                    >
                      <span>
                        <span className="block text-sm font-medium text-ink">
                          {project.name}
                        </span>
                        <span className="block text-[11px] text-muted">
                          {project.progress}% · {project.status}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-muted">
                        Open
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">Select a client to explore.</p>
          )}
        </div>
      </div>
    </div>
  );
}
