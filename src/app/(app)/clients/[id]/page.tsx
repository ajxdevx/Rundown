"use client";

import ClientDetailPage from "@/components/ClientDetailPage";
import { use } from "react";

export default function ClientIdRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ClientDetailPage id={id} />;
}
