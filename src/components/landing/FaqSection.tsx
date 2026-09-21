"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { landingFaqs } from "@/data/landingDemo";
import { trackLanding } from "@/lib/landingAnalytics";
import { Reveal } from "./motion/Reveal";
import { SectionHeader } from "./SectionHeader";

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(landingFaqs[0]?.id ?? null);

  return (
    <section
      id="faq"
      className="landing-section scroll-mt-24"
      aria-labelledby="faq-heading"
    >
      <div className="landing-shell">
        <Reveal>
          <SectionHeader
            id="faq-heading"
            eyebrow="FAQ"
            title="Common questions"
            description="Clear answers while Dueso is in early access."
          />
        </Reveal>

        <Reveal delayMs={40} className="mt-12 max-w-3xl">
          <div className="divide-y divide-border border-y border-border">
            {landingFaqs.map((faq) => {
              const open = openId === faq.id;
              return (
                <div key={faq.id}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`${faq.id}-panel`}
                      id={`${faq.id}-button`}
                      onClick={() => {
                        const next = open ? null : faq.id;
                        setOpenId(next);
                        if (next) trackLanding("faq_open", { id: faq.id });
                      }}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-semibold text-ink transition-colors duration-150 hover:text-ink/80"
                    >
                      {faq.question}
                      <ChevronDown
                        className={`faq-chevron size-5 shrink-0 text-muted transition-transform duration-150 ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={`${faq.id}-panel`}
                    role="region"
                    aria-labelledby={`${faq.id}-button`}
                    aria-hidden={!open}
                    className="faq-panel"
                    data-open={open ? "true" : "false"}
                  >
                    <div className="faq-panel-inner">
                      <p className="pb-5 text-base leading-relaxed text-muted">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
