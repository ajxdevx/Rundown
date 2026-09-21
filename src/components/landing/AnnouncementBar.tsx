"use client";

import { ArrowRight } from "lucide-react";
import { useWaitlist } from "./waitlist";

export function AnnouncementBar() {
  const { openWaitlist } = useWaitlist();

  return (
    <div className="border-b border-border bg-accent-soft">
      <button
        type="button"
        onClick={() => openWaitlist("announcement")}
      className="mx-auto flex w-full items-center justify-center gap-2 px-3 py-3 text-center text-sm text-ink transition-colors hover:bg-accent/30 sm:px-4 sm:text-[15px]"
      >
        <span>
          Dueso is opening early access
          <span className="mx-1.5 text-muted" aria-hidden>
            →
          </span>
          Join the waitlist
        </span>
        <ArrowRight className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </button>
    </div>
  );
}
