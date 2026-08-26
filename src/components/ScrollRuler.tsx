"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollSection = {
  id: string;
  label: string;
};

/** Rhythmic short / medium tick widths (px), like a vertical ruler. */
const TICKS = [
  10, 14, 10, 10, 14, 10, 10, 16, 10, 10, 14, 10, 10, 14, 10, 16, 10, 10, 14, 10,
  10, 14, 10, 10,
];

function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return window;
}

function scrollToSection(scroller: HTMLElement | Window, id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  if (scroller === window) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const el = scroller as HTMLElement;
  const parentTop = el.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  el.scrollTo({
    top: el.scrollTop + (targetTop - parentTop) - 16,
    behavior: "smooth",
  });
}

type ScrollRulerProps = {
  sections: ScrollSection[];
  toolName?: string;
};

function formatSectionLabel(section: ScrollSection, toolName?: string) {
  if (!toolName) return section.label;

  switch (section.id) {
    case "overview":
      return section.label;
    case "about":
      return `About ${toolName}`;
    case "what-is-it":
      return `What is ${toolName}?`;
    case "who-is-it-for":
      return `Who is ${toolName} For?`;
    case "how-it-works":
      return `How ${toolName} Works`;
    case "pricing-details":
      return `${toolName} Pricing`;
    case "pros-cons":
      return `${toolName} Pros and Cons`;
    case "honest-review":
      return `${toolName} Honest Review`;
    case "faq":
      return `${toolName} FAQ`;
    case "screenshots":
      return `${toolName} Screenshots`;
    case "reviews":
      return `${toolName} Reviews`;
    default:
      return section.label.includes(toolName)
        ? section.label
        : `${section.label} ${toolName}`;
  }
}

export default function ScrollRuler({ sections, toolName }: ScrollRulerProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<HTMLButtonElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(
    sections[0]?.id ?? "",
  );

  useEffect(() => {
    if (!root) return;

    const scroller = getScrollParent(root);

    const update = () => {
      if (scroller === window) {
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      } else {
        const el = scroller as HTMLElement;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
      }

      const viewportTop =
        scroller === window
          ? 80
          : (scroller as HTMLElement).getBoundingClientRect().top + 80;

      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const node = document.getElementById(section.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= viewportTop) {
          current = section.id;
        }
      }
      setActiveSectionId(current);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [root, sections]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (wrapRef.current && target && !wrapRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };

    // Defer so the opening click doesn't immediately close the panel.
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("touchstart", onPointerDown);
    }, 0);

    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const activeIndex = Math.round(progress * (TICKS.length - 1));

  const jumpTo = (id: string) => {
    if (!root) return;
    scrollToSection(getScrollParent(root), id);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        ref={setRoot}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Contents"
        title="Contents"
        className={`flex cursor-pointer flex-col items-center gap-[5px] rounded-lg px-2.5 py-3 hover-soft ${
          open ? "bg-zinc-800" : ""
        }`}
      >
        {TICKS.map((width, i) => {
          const active = i === activeIndex;
          return (
            <span
              key={i}
              className={`h-[2px] rounded-full transition-[background-color,width] duration-150 ${
                active ? "bg-white" : "bg-zinc-600"
              }`}
              style={{ width: active ? Math.max(width, 16) : width }}
            />
          );
        })}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Contents"
          className="absolute top-1/2 left-full z-[80] ml-3 w-56 -translate-y-1/2 overflow-hidden rounded-xl border border-zinc-700/60 bg-[#1a1a1a] shadow-xl sm:w-64"
        >
          <div className="border-b border-zinc-700/60 bg-zinc-800 px-3 py-3">
            <p className="text-center font-mono text-base font-semibold tracking-tight text-white sm:text-lg">
              Contents
            </p>
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden px-1.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => {
              const active = section.id === activeSectionId;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="menuitem"
                  onClick={() => jumpTo(section.id)}
                  className={`cursor-pointer truncate rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-zinc-800 font-semibold text-white"
                      : "font-medium text-white hover-soft"
                  }`}
                >
                  {formatSectionLabel(section, toolName)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
