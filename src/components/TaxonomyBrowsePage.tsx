"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { MainContentSkeleton } from "@/components/AppSkeleton";
import BrowseToolsView from "@/components/BrowseToolsView";
import {
  fetchToolsByCategorySlug,
  fetchToolsByCompanySlug,
  fetchToolsByFeatureSlug,
  fetchToolsByTagSlug,
  type Tool,
} from "@/data/tools";

type Kind = "category" | "company" | "feature" | "tag";

type BrowseResult = {
  title: string;
  description?: string | null;
  tools: Tool[];
  error: string | null;
  notFound?: boolean;
};

const fetchers: Record<Kind, (slug: string) => Promise<BrowseResult>> = {
  category: fetchToolsByCategorySlug,
  company: fetchToolsByCompanySlug,
  feature: fetchToolsByFeatureSlug,
  tag: fetchToolsByTagSlug,
};

const labels: Record<Kind, string> = {
  category: "Category",
  company: "Company",
  feature: "Feature",
  tag: "Tag",
};

export default function TaxonomyBrowsePage({ kind }: { kind: Kind }) {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [title, setTitle] = useState(slug);
  const [description, setDescription] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setTools([]);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    if (!hasLoadedRef.current) setLoading(true);

    void fetchers[kind](slug).then((result) => {
      if (cancelled) return;
      setTitle(result.title);
      setDescription(result.description ?? null);
      setTools(result.tools);
      setError(result.error);
      setNotFound(Boolean(result.notFound));
      hasLoadedRef.current = true;
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [kind, slug]);

  if (loading) {
    return <MainContentSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-white">
            Couldn&apos;t load {labels[kind].toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-white">
            {labels[kind]} not found
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Nothing matches &ldquo;{slug}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  const countLabel = `${tools.length} tool${tools.length === 1 ? "" : "s"}`;
  const subtitle = description
    ? `${description} · ${countLabel}`
    : `${labels[kind]} · ${countLabel}`;

  return (
    <BrowseToolsView
      title={title}
      subtitle={subtitle}
      tools={tools}
      emptyMessage={`No active tools in this ${labels[kind].toLowerCase()} yet.`}
    />
  );
}
