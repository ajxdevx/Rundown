"use client";

import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { featuredTools } from "@/data/tools";

const PER_VIEW = 4;
const INTERVAL_MS = 8000;
const PAGES = Math.ceil(featuredTools.length / PER_VIEW);

export default function FeaturedCarousel() {
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % PAGES);
    }, INTERVAL_MS);
  }, [clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goToPage = (index: number) => {
    setPage(index);
    startTimer();
  };

  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-[#1a1a1a] p-4 sm:p-5">
      <h2 className="mb-4 text-center font-mono text-sm font-medium text-zinc-400">
        Featured Tools
      </h2>

      <div className="overflow-hidden">
        <div
          className="flex ease-in-out"
          style={{
            transform: `translateX(-${page * 100}%)`,
            transition: "transform 1.2s ease-in-out",
          }}
        >
          {Array.from({ length: PAGES }, (_, pageIndex) => (
            <div
              key={pageIndex}
              className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {featuredTools
                .slice(pageIndex * PER_VIEW, pageIndex * PER_VIEW + PER_VIEW)
                .map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#0f0f0f] p-3 text-left transition-colors duration-200 hover:bg-zinc-800"
                  >
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: tool.color }}
                    >
                      {tool.initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-white">
                        {tool.name}
                      </p>
                      <p className="truncate text-sm text-zinc-400">
                        {tool.category}
                      </p>
                    </div>

                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-black">
                      <ArrowUpRight className="size-4" strokeWidth={2.25} />
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: PAGES }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to featured page ${i + 1}`}
            onClick={() => goToPage(i)}
            className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
              page === i
                ? "w-6 bg-white"
                : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
