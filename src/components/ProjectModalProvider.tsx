"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import ProjectFormModal, {
  type ProjectFormEditValues,
} from "./ProjectFormModal";

type CreateOptions = {
  clientId?: string;
  restoreDraft?: boolean;
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
    setEditInitial(null);
    setEditSuccess(null);
  }, []);

  const openCreate = useCallback((options?: CreateOptions) => {
    setEditOpen(false);
    setEditInitial(null);
    setClientId(options?.clientId);
    setRestoreDraft(Boolean(options?.restoreDraft));
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((options: EditOptions) => {
    setCreateOpen(false);
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
