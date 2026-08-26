"use client";

import { useEffect, useState } from "react";
import BrowseToolsView from "@/components/BrowseToolsView";
import { fetchToolsByIds, type Tool } from "@/data/tools";
import { getRecentToolIds } from "@/lib/recentTools";

export default function HistoryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ids = getRecentToolIds();
    if (ids.length === 0) {
      setTools([]);
      setLoading(false);
      return;
    }

    void fetchToolsByIds(ids).then((result) => {
      if (cancelled) return;
      setTools(result.tools);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full px-4 py-6 sm:px-5" aria-busy>
        <div className="auth-skeleton mb-6 h-7 w-40 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-white">
            Couldn&apos;t load history
          </p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <BrowseToolsView
      title="Recently viewed"
      subtitle={`${tools.length} tool${tools.length === 1 ? "" : "s"}`}
      tools={tools}
      emptyMessage="Tools you open will show up here."
      showFeatured={false}
    />
  );
}
