"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectModal } from "./ProjectModalProvider";

/**
 * Legacy `/projects/new` route — opens the Create Project modal over Projects
 * and replaces the URL so creation stays contextual (spec §2 / §4).
 */
export default function CreateProjectPage({
  preselectedClientId,
  restoreDraft = false,
}: {
  preselectedClientId?: string;
  restoreDraft?: boolean;
}) {
  const router = useRouter();
  const { openCreate } = useProjectModal();

  useEffect(() => {
    openCreate({
      clientId: preselectedClientId,
      restoreDraft,
    });
    router.replace("/projects");
  }, [openCreate, preselectedClientId, restoreDraft, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-muted">Opening create project…</p>
    </div>
  );
}
