"use client";

import { featuredTools, tools } from "@/data/tools";
import SubmitToolBar from "./SubmitToolBar";

const FEATURED_PER_VIEW = 4;
const FEATURED_PAGES = Math.ceil(featuredTools.length / FEATURED_PER_VIEW);

/** Invisible text reserves real line-height; skeleton bar fills the same box. */
function TextSkeleton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-block max-w-full align-top ${className}`}>
      <span className="invisible">{children}</span>
      <span className="auth-skeleton absolute inset-0 rounded" aria-hidden />
    </span>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#0f0f0f] p-3">
      <div className="auth-skeleton size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">
          <TextSkeleton>Featured tool name</TextSkeleton>
        </p>
        <p className="truncate text-sm">
          <TextSkeleton>Category</TextSkeleton>
        </p>
      </div>
      <div className="auth-skeleton size-8 shrink-0 rounded-lg" />
    </div>
  );
}

function ToolCardSkeleton() {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414]">
      <div className="auth-skeleton aspect-[16/10] w-full rounded-none" />
      <div className="flex items-start gap-3 p-4">
        <div className="auth-skeleton size-10 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">
            <TextSkeleton>Tool name here</TextSkeleton>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-sm">
            <TextSkeleton className="block w-full">
              Short description that fills two lines of card body copy for spacing.
            </TextSkeleton>
          </p>
        </div>
      </div>
    </article>
  );
}

/** Home skeleton — featured + cards only. Submit bar stays real (no skeleton). */
export function MainContentSkeleton() {
  return (
    <div className="w-full px-4 py-6 sm:px-5" aria-busy aria-label="Loading">
      <section className="mb-8">
        <div className="rounded-2xl border border-zinc-700/60 bg-[#1a1a1a] p-4 sm:p-5">
          <h2 className="mb-4 text-center font-mono text-sm font-medium">
            <TextSkeleton>Featured Tools</TextSkeleton>
          </h2>

          <div className="overflow-hidden">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: FEATURED_PER_VIEW }, (_, i) => (
                <FeaturedCardSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: FEATURED_PAGES }, (_, i) => (
              <div
                key={i}
                className={`auth-skeleton h-1.5 rounded-full ${
                  i === 0 ? "w-6" : "w-1.5"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <SubmitToolBar />
      </section>

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: tools.length }, (_, i) => (
            <ToolCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
