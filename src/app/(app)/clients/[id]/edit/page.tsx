"use client";

import ClientFormPage from "@/components/AddClientPage";
import { use } from "react";

export default function EditClientRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ClientFormPage mode="edit" clientId={id} />;
}
