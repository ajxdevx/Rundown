"use client";

import CreateProjectPage from "@/components/CreateProjectPage";
import { use } from "react";

export default function NewProjectRoute({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; restore?: string }>;
}) {
  const sp = use(searchParams);
  return (
    <CreateProjectPage
      preselectedClientId={sp.client}
      restoreDraft={sp.restore === "1"}
    />
  );
}
