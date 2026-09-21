"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientModal } from "./ClientModalProvider";

/**
 * Legacy `/clients/new` and `/clients/[id]/edit` — opens the shared modal.
 */
export default function ClientFormPage({
  mode,
  clientId,
}: {
  mode: "add" | "edit";
  clientId?: string;
}) {
  const router = useRouter();
  const { openAdd, openEdit } = useClientModal();

  useEffect(() => {
    if (mode === "edit" && clientId) {
      openEdit({ clientId });
      router.replace(`/clients/${clientId}`);
      return;
    }
    openAdd();
    router.replace("/clients");
  }, [mode, clientId, openAdd, openEdit, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted">
        {mode === "edit" ? "Opening edit client…" : "Opening add client…"}
      </p>
    </div>
  );
}
