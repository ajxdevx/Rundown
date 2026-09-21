"use client";

import { type FormEvent, useState } from "react";
import Popup from "@/components/Popup";
import { useToast } from "@/components/ToastProvider";
import { useDemoState } from "./DemoStateProvider";

export function DemoCreateProjectModal() {
  const { createModalOpen, setCreateModalOpen, clients, createProject } =
    useDemoState();
  const toast = useToast();
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");

  const onClose = () => {
    setCreateModalOpen(false);
    setName("");
    setClientId(clients[0]?.id ?? "");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;
    createProject({ name: name.trim(), clientId });
    toast.success("Project created");
    setName("");
    setClientId(clients[0]?.id ?? "");
  };

  return (
    <Popup
      open={createModalOpen}
      onClose={onClose}
      labelledBy="demo-create-project-title"
      panelClassName="w-full max-w-md bg-card"
      showCloseButton
    >
      <form onSubmit={onSubmit} className="p-5 sm:p-6">
        <div className="pr-8">
          <h2
            id="demo-create-project-title"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Create project
          </h2>
          <p className="mt-1 text-sm text-muted">
            Demo only — stays local to this landing-page experience.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="demo-project-name"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Project name
            </label>
            <input
              id="demo-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              required
              className="input-field"
            />
          </div>
          <div>
            <label
              htmlFor="demo-project-client"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Client
            </label>
            <select
              id="demo-project-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="input-field"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-10 px-4 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-accent h-10 px-4 text-sm font-medium"
          >
            Create project
          </button>
        </div>
      </form>
    </Popup>
  );
}
