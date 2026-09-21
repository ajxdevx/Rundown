"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CreatedProject } from "@/lib/createProject";
import ProjectFormModal, {
  type ProjectFormEditValues,
} from "./ProjectFormModal";

type CreateOptions = {
  clientId?: string;
  restoreDraft?: boolean;
  skipNavigate?: boolean;
  onSuccess?: (project: CreatedProject) => void;
};

type EditOptions = {
  initial: ProjectFormEditValues;
  onSuccess?: (values: ProjectFormEditValues) => void;
};

type ProjectModalContextValue = {
  openCreate: (options?: CreateOptions) => void;
  openEdit: (options: EditOptions) => void;
  close: () => void;
};

const ProjectModalContext = createContext<ProjectModalContextValue | null>(
  null,
);

export function useProjectModal() {
  const ctx = useContext(ProjectModalContext);
  if (!ctx) {
    throw new Error("useProjectModal must be used within ProjectModalProvider");
  }
  return ctx;
}

export function useProjectModalOptional() {
  return useContext(ProjectModalContext);
}

export function ProjectModalProvider({ children }: { children: ReactNode }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>();
  const [restoreDraft, setRestoreDraft] = useState(false);
  const [skipNavigate, setSkipNavigate] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<
    ((project: CreatedProject) => void) | null
  >(null);
  const [editInitial, setEditInitial] = useState<ProjectFormEditValues | null>(
    null,
  );
  const [editSuccess, setEditSuccess] = useState<
    ((values: ProjectFormEditValues) => void) | null
  >(null);

  const close = useCallback(() => {
    setCreateOpen(false);
    setEditOpen(false);
    setClientId(undefined);
    setRestoreDraft(false);
    setSkipNavigate(false);
    setCreateSuccess(null);
    setEditInitial(null);
    setEditSuccess(null);
  }, []);

  const openCreate = useCallback((options?: CreateOptions) => {
    setEditOpen(false);
    setEditInitial(null);
    setEditSuccess(null);
    setClientId(options?.clientId);
    setRestoreDraft(Boolean(options?.restoreDraft));
    setSkipNavigate(Boolean(options?.skipNavigate));
    setCreateSuccess(() => options?.onSuccess ?? null);
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((options: EditOptions) => {
    setCreateOpen(false);
    setCreateSuccess(null);
    setEditInitial(options.initial);
    setEditSuccess(() => options.onSuccess ?? null);
    setEditOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openCreate, openEdit, close }),
    [openCreate, openEdit, close],
  );

  return (
    <ProjectModalContext.Provider value={value}>
      {children}
      <ProjectFormModal
        open={createOpen}
        onClose={close}
        mode="create"
        preselectedClientId={clientId}
        restoreDraft={restoreDraft}
        skipNavigate={skipNavigate}
        onSuccess={(result) => {
          if (!("slug" in result)) return;
          createSuccess?.(result);
        }}
      />
      <ProjectFormModal
        open={editOpen}
        onClose={close}
        mode="edit"
        initial={editInitial}
        onSuccess={(result) => {
          if ("slug" in result) return;
          editSuccess?.(result);
        }}
      />
    </ProjectModalContext.Provider>
  );
}
