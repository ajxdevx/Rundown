"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

export const categories = [
  { id: "all", name: "All", description: "Browse every tool" },
  { id: "writing", name: "Writing", description: "Writing tools" },
  {
    id: "chat",
    name: "Chat & Assistants",
    description: "Chat and AI assistants",
  },
  { id: "image", name: "Image", description: "Image tools" },
  { id: "video", name: "Video", description: "Video tools" },
  { id: "audio", name: "Audio & Voice", description: "Audio and voice tools" },
  { id: "music", name: "Music", description: "Music tools" },
  { id: "coding", name: "Coding", description: "Coding tools" },
  { id: "design", name: "Design", description: "Design tools" },
  { id: "marketing", name: "Marketing", description: "Marketing tools" },
  { id: "seo", name: "SEO", description: "SEO tools" },
  { id: "research", name: "Research", description: "Research tools" },
  {
    id: "productivity",
    name: "Productivity",
    description: "Productivity tools",
  },
  { id: "business", name: "Business", description: "Business tools" },
  { id: "education", name: "Education", description: "Education tools" },
  {
    id: "presentations",
    name: "Presentations",
    description: "Presentation tools",
  },
  { id: "social", name: "Social Media", description: "Social media tools" },
  { id: "automation", name: "Automation", description: "Automation tools" },
  {
    id: "data",
    name: "Data & Analytics",
    description: "Data and analytics tools",
  },
  { id: "spatial", name: "3D & Spatial", description: "3D and spatial tools" },
  { id: "translation", name: "Translation", description: "Translation tools" },
  {
    id: "support",
    name: "Customer Support",
    description: "Customer support tools",
  },
  { id: "sales", name: "Sales", description: "Sales tools" },
  { id: "finance", name: "Finance", description: "Finance tools" },
  { id: "legal", name: "Legal", description: "Legal tools" },
  {
    id: "health",
    name: "Health & Wellness",
    description: "Health and wellness tools",
  },
] as const;

export default function CategoryBar() {
  const [active, setActive] = useState("all");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  // Categories always overflow — start true so the right-edge fade is present
  // on first paint (same before/after auth load; never looks like it bleeds
  // into the right sidebar).
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useLayoutEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollState())
        : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      ro?.disconnect();
    };
  }, [updateScrollState]);

  const scrollByAmount = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;

    dragRef.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;

    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.scrollLeft - delta;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;

    drag.active = false;
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <div className="relative flex h-14 w-full min-w-0 shrink-0 items-center overflow-hidden border-b border-zinc-700/60">
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pr-10 pl-2 transition-opacity duration-150 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Scroll categories left"
          tabIndex={canScrollLeft ? 0 : -1}
          onClick={() => scrollByAmount(-220)}
          className="pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="flex h-full w-full min-w-0 cursor-grab items-center gap-1 overflow-x-auto px-4 active:cursor-grabbing touch-pan-x select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => {
          const isActive = active === category.id;

          return (
            <button
              key={category.id}
              type="button"
              title={category.description}
              onClick={() => setActive(category.id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-200 hover:bg-zinc-800 hover:text-white ${
                isActive
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Always mounted — same right edge before/after load; never bleeds into sidebar */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pl-10 pr-2 transition-opacity duration-150 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Scroll categories right"
          tabIndex={canScrollRight ? 0 : -1}
          onClick={() => scrollByAmount(220)}
          className="pointer-events-auto flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
