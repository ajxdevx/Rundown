"use client";

import ProjectDetailPage from "@/components/ProjectDetailPage";
import { use } from "react";

export default function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = use(params);
  const sp = use(searchParams);
  return <ProjectDetailPage slug={slug} initialTab={sp.tab} />;
}
