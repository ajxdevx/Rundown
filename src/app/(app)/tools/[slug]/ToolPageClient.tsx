"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ToolDetailPage from "@/components/ToolDetailPage";
import { fetchActiveToolBySlug, type Tool } from "@/data/tools";

type LoadState = "loading" | "ready" | "error" | "missing";

export default function ToolPageClient({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [tool, setTool] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setState("missing");
      return;
    }

    let cancelled = false;
    setState("loading");

    void fetchActiveToolBySlug(slug).then((result) => {
      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setTool(null);
        setState("error");
        return;
      }

      if (!result.tool) {
        setTool(null);
        setError(null);
        setState("missing");
        return;
      }

      setTool(result.tool);
      setError(null);
      setState("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <div
        className="w-full px-8 py-6 sm:px-12 sm:py-8 lg:px-16 xl:px-20 2xl:px-24"
        aria-busy
        aria-label="Loading"
      >
        <div className="auth-skeleton mb-5 h-4 w-16 rounded" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
          <div>
            <div className="flex items-start gap-4">
              <div className="auth-skeleton size-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="auth-skeleton h-9 w-56 rounded" />
                <div className="auth-skeleton h-4 w-40 rounded" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="auth-skeleton h-4 w-full rounded" />
              <div className="auth-skeleton h-4 w-[92%] rounded" />
            </div>
          </div>
          <div className="auth-skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-white">
            Couldn&apos;t load tool
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {error || "Something went wrong. Please try again."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (state === "missing" || !tool) {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-[#141414] px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-white">Tool not found</p>
          <p className="mt-1 text-sm text-zinc-400">
            This tool is missing or no longer active.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <ToolDetailPage tool={tool} onToolChange={setTool} />;
}
