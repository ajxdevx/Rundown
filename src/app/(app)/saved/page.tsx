"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import BrowseToolsView from "@/components/BrowseToolsView";
import { fetchSavedTools, requestSignIn } from "@/data/toolActions";
import type { Tool } from "@/data/tools";

export default function SavedPage() {
  const { user, status, authLoading } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTools([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchSavedTools(user.id).then((result) => {
      if (cancelled) return;
      setTools(result.tools);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="w-full px-4 py-6 sm:px-5" aria-busy>
        <div className="auth-skeleton mb-6 h-7 w-40 rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="auth-skeleton aspect-[16/10] rounded-2xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-white">Saved tools</p>
          <p className="mt-1 text-sm text-zinc-400">
            Sign in to view tools you&apos;ve saved.
          </p>
          <button
            type="button"
            onClick={() => requestSignIn()}
            className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-black"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-6 sm:px-5">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-white">
            Couldn&apos;t load saved tools
          </p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-300">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BrowseToolsView
      title="Saved"
      subtitle={`${tools.length} tool${tools.length === 1 ? "" : "s"}`}
      tools={tools}
      emptyMessage="You haven't saved any tools yet."
      showFeatured={false}
    />
  );
}
