"use client";

import { useRouter } from "next/navigation";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import SubmitToolBar from "@/components/SubmitToolBar";
import ToolCard from "@/components/ToolCard";
import { getFeaturedTools, type Tool } from "@/data/tools";

type BrowseToolsViewProps = {
  title: string;
  subtitle?: string;
  tools: Tool[];
  emptyMessage?: string;
  showFeatured?: boolean;
};

export default function BrowseToolsView({
  title,
  subtitle,
  tools,
  emptyMessage = "No tools found.",
  showFeatured = true,
}: BrowseToolsViewProps) {
  const router = useRouter();
  const openTool = (tool: Tool) => router.push(`/tools/${tool.slug}`);
  const featured = showFeatured ? getFeaturedTools(tools) : [];

  return (
    <div className="w-full px-4 py-6 sm:px-5">
      {showFeatured ? (
        <section className="mb-8">
          {featured.length > 0 ? (
            <FeaturedCarousel tools={featured} onSelect={openTool} />
          ) : (
            <div className="rounded-2xl border border-zinc-700/60 bg-[#1a1a1a] px-6 py-10 text-center">
              <p className="font-mono text-sm font-medium text-zinc-400">
                Featured Tools
              </p>
              <p className="mt-2 text-sm text-zinc-500">No featured tools yet.</p>
            </div>
          )}
        </section>
      ) : null}

      <section className="mb-8">
        <SubmitToolBar />
      </section>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      {tools.length === 0 ? (
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onSelect={openTool} />
          ))}
        </div>
      )}
    </div>
  );
}
