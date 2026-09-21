"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const WORDS = ["work", "ship", "build", "grow", "sync"] as const;

/** Fixed pill — taller, narrower, never resizes on word change. */
export function RotatingPillWord({
  intervalMs = 2600,
}: {
  intervalMs?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduced) return;

    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 180);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [reduced, intervalMs]);

  const word = WORDS[index];

  return (
    <span
      className="inline-flex h-[1.28em] w-[3.85em] shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent-soft align-middle"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="size-[0.28em] shrink-0 rounded-full bg-success"
        aria-hidden
      />
      <span
        className="w-[2.35em] text-center text-[0.82em] font-semibold capitalize leading-none text-ink transition-opacity duration-200"
        style={{ opacity: visible || reduced ? 1 : 0 }}
      >
        {word}
      </span>
    </span>
  );
}
