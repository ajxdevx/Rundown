"use client";

import ClientPortalPage from "@/components/ClientPortalPage";
import { use } from "react";

export default function PortalSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <ClientPortalPage slug={slug} />;
}
