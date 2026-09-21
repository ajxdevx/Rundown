"use client";

import { SectionHeader } from "./SectionHeader";
import { WaitlistForm } from "./waitlist";

export function WaitlistSection() {
  return (
    <section
      id="early-access"
      className="landing-section scroll-mt-24 border-t border-border/60"
      aria-labelledby="early-access-heading"
    >
      <div className="landing-shell">
        <div
          id="pricing"
          className="scroll-mt-24 rounded-[var(--radius-lg)] border border-border bg-card px-6 py-12 sm:px-12 sm:py-14"
        >
          <SectionHeader
            id="early-access-heading"
            eyebrow="Early access"
            title="Ready to simplify your projects?"
            description="Join the Dueso early access list. Be among the first to try Dueso and help shape the product — no fabricated urgency, no fake scarcity."
          />

          <WaitlistForm
            source="inline_section"
            variant="inline"
            idPrefix="inline-section"
            className="mt-10 max-w-md"
          />
        </div>
      </div>
    </section>
  );
}
