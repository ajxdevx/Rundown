"use client";

import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Tool } from "@/data/tools";

const PER_VIEW = 4;
const INTERVAL_MS = 8000;

type FeaturedCarouselProps = {
  tools: Tool[];
  onSelect?: (tool: Tool) => void;
};

export default function FeaturedCarousel({
  tools,
  onSelect,
}: FeaturedCarouselProps) {
  const pages = Math.max(1, Math.ceil(tools.length / PER_VIEW));
  const [page, setPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const safePage = useMemo(
    () => Math.min(page, pages - 1),
    [page, pages],
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (pages <= 1) return;
    timerRef.current = setInterval(() => {
      setPage((p) => (p + 1) % pages);
    }, INTERVAL_MS);
  }, [clearTimer, pages]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

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
            transform: `translateX(-${safePage * 100}%)`,
            transition: "transform 1.2s ease-in-out",
          }}
        >
          {Array.from({ length: pages }, (_, pageIndex) => (
            <div
              key={pageIndex}
              className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            >
              {tools
                .slice(pageIndex * PER_VIEW, pageIndex * PER_VIEW + PER_VIEW)
                .map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelect?.(tool)}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#0f0f0f] p-3 text-left hover-soft"
                  >
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: tool.color }}
                    >
                      {tool.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tool.logoUrl}
                          alt=""
                          className="size-7 object-contain"
                        />
                      ) : (
                        tool.initial
                      )}
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
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to featured page ${i + 1}`}
            onClick={() => goToPage(i)}
            className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
              safePage === i
                ? "w-6 bg-white"
                : "w-1.5 bg-zinc-600 hover:bg-zinc-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
