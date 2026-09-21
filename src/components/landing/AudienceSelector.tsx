"use client";

import { useState } from "react";
import { landingAudiences } from "@/data/landingDemo";
import { SectionHeader } from "./SectionHeader";

export function AudienceSelector() {
  const [active, setActive] = useState<string>(landingAudiences[0]);

  return (
    <section
      className="landing-section mx-auto scroll-mt-24"
      aria-labelledby="audience-heading"
    >
      <div className="landing-shell">
        <SectionHeader
          id="audience-heading"
          eyebrow="Who it’s for"
          title="Built around client-based work"
          description="Dueso is intentionally designed for service businesses — not ecommerce, not consumer task apps, not enterprise process suites."
        />

        <div
          className="mt-10 flex flex-wrap gap-2.5"
          role="list"
          aria-label="Audience types"
        >
          {landingAudiences.map((label) => {
            const selected = active === label;
            return (
              <button
                key={label}
                type="button"
                role="listitem"
                aria-pressed={selected}
                onClick={() => setActive(label)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors sm:px-5 sm:py-2.5 sm:text-[15px] ${
                  selected
                    ? "border-ink bg-ink text-background"
                    : "border-border bg-card text-ink hover:border-ink/30"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted">
          Selected focus: <span className="font-medium text-ink">{active}</span>.
          Dueso keeps project delivery and client collaboration in one calm system
          — without exposing your internal workspace.
        </p>
      </div>
    </section>
  );
}
