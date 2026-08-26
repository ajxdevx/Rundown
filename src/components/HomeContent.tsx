"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainContentSkeleton } from "@/components/AppSkeleton";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import SubmitToolBar from "@/components/SubmitToolBar";
import ToolCard from "@/components/ToolCard";
import {
  fetchActiveTools,
  fetchToolsByIds,
  getFeaturedTools,
  type Tool,
} from "@/data/tools";
import { getRecentToolIds } from "@/lib/recentTools";

type LoadState = "loading" | "ready" | "error";

export default function HomeContent() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [tools, setTools] = useState<Tool[]>([]);
  const [recent, setRecent] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchActiveTools().then((result) => {
      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setTools([]);
        setState("error");
        return;
      }

      setTools(result.tools);
      setError(null);
      setState("ready");
    });

    const recentIds = getRecentToolIds().slice(0, 8);
    if (recentIds.length > 0) {
      void fetchToolsByIds(recentIds).then((result) => {
        if (!cancelled && !result.error) setRecent(result.tools);
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const openTool = (tool: Tool) => {
    router.push(`/tools/${tool.slug}`);
  };

  if (state === "loading") {
    return <MainContentSkeleton />;
  }

  if (state === "error") {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <section className="mb-8">
          <div className="rounded-2xl border border-zinc-700/60 bg-[#1a1a1a] px-6 py-12 text-center">
            <p className="text-[15px] font-semibold text-white">
              Couldn&apos;t load tools
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {error || "Something went wrong. Please try again."}
            </p>
          </div>
        </section>

        <section className="mb-8">
          <SubmitToolBar />
        </section>
      </div>
    );
  }

  const featured = getFeaturedTools(tools);

  return (
    <div className="w-full px-4 py-6 sm:px-5">
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

      <section className="mb-8">
        <SubmitToolBar />
      </section>

      {recent.length > 0 ? (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-sm font-medium text-zinc-400">
              Recently viewed
            </h2>
            <button
              type="button"
              onClick={() => router.push("/history")}
              className="cursor-pointer text-sm text-zinc-500 hover-soft-muted rounded-lg px-2 py-1"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((tool) => (
              <ToolCard
                key={`recent-${tool.id}`}
                tool={tool}
                onSelect={openTool}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        {tools.length === 0 ? (
          <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
            <p className="text-[15px] font-semibold text-white">No tools yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              There are no active tools to show right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onSelect={openTool} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
