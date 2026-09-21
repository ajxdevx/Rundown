"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Client } from "@/data/clientsMock";
import ClientFormModal from "./ClientFormModal";

type AddOptions = {
  nestMode?: boolean;
  onCreated?: (client: Client) => void;
  skipNavigate?: boolean;
};

type EditOptions = {
  clientId: string;
  onUpdated?: (client: Client) => void;
};

type ClientModalContextValue = {
  openAdd: (options?: AddOptions) => void;
  openEdit: (options: EditOptions) => void;
  close: () => void;
};

const ClientModalContext = createContext<ClientModalContextValue | null>(null);

export function useClientModal() {
  const ctx = useContext(ClientModalContext);
  if (!ctx) {
    throw new Error("useClientModal must be used within ClientModalProvider");
  }
  return ctx;
}

export function useClientModalOptional() {
  return useContext(ClientModalContext);
}

export function ClientModalProvider({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | undefined>();
  const [nestMode, setNestMode] = useState(false);
  const [skipNavigate, setSkipNavigate] = useState(false);
  const [onCreated, setOnCreated] = useState<
    ((client: Client) => void) | null
  >(null);
  const [onUpdated, setOnUpdated] = useState<
    ((client: Client) => void) | null
  >(null);

  const close = useCallback(() => {
    setAddOpen(false);
    setEditOpen(false);
    setEditClientId(undefined);
    setNestMode(false);
    setSkipNavigate(false);
    setOnCreated(null);
    setOnUpdated(null);
  }, []);

  const openAdd = useCallback((options?: AddOptions) => {
    setEditOpen(false);
    setEditClientId(undefined);
    setNestMode(Boolean(options?.nestMode));
    setSkipNavigate(Boolean(options?.skipNavigate || options?.nestMode));
    setOnCreated(() => options?.onCreated ?? null);
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((options: EditOptions) => {
    setAddOpen(false);
    setEditClientId(options.clientId);
    setOnUpdated(() => options.onUpdated ?? null);
    setEditOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openAdd, openEdit, close }),
    [openAdd, openEdit, close],
  );

  return (
    <ClientModalContext.Provider value={value}>
      {children}
      <ClientFormModal
        open={addOpen}
        onClose={close}
        mode="add"
        nestMode={nestMode}
        skipNavigate={skipNavigate}
        onCreated={(client) => onCreated?.(client)}
      />
      <ClientFormModal
        open={editOpen}
        onClose={close}
        mode="edit"
        clientId={editClientId}
        onUpdated={(client) => onUpdated?.(client)}
      />
    </ClientModalContext.Provider>
  );
}
