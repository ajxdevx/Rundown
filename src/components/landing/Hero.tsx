"use client";

import { ArrowRight } from "lucide-react";
import { trackLanding } from "@/lib/landingAnalytics";
import { scrollToId } from "@/lib/landingScroll";
import { ProductPreview } from "./ProductPreview";
import { RotatingPillWord } from "./RotatingPillWord";
import { JoinWaitlistButton } from "./waitlist";

export function Hero() {
  return (
    <section className="relative w-full pt-20 sm:pt-24" aria-labelledby="hero-heading">
      {/* Full width, small padding only — lets the headline scale larger */}
      <div className="w-full px-3 text-center sm:px-4">
        <h1
          id="hero-heading"
          className="font-[family-name:var(--font-brand)] font-semibold tracking-[-0.045em] text-ink"
        >
          <span className="block whitespace-nowrap text-[clamp(2.5rem,7.4vw,6.5rem)] leading-[1.26]">
            Where projects and clients
          </span>
          <span className="mt-3 flex items-center justify-center gap-3 whitespace-nowrap text-[clamp(2.5rem,7.4vw,6.5rem)] leading-[1.26] sm:mt-4 sm:gap-4">
            <RotatingPillWord />
            <span>together.</span>
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted sm:mt-10 sm:text-xl">
          Capture progress, share files, and get paid — with a portal built for
          every client.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:mt-12">
          <JoinWaitlistButton
            source="hero"
            size="lg"
            className="h-12 px-7 text-[15px] sm:h-14 sm:px-8 sm:text-base"
          >
            Join Waitlist
          </JoinWaitlistButton>
          <button
            type="button"
            onClick={() => {
              trackLanding("hero_cta_explore");
              scrollToId("product");
            }}
            className="inline-flex h-12 items-center gap-2 px-2 text-[15px] font-medium text-ink transition-colors hover:text-ink/70 sm:h-14 sm:text-base"
          >
            Explore Dueso
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        id="product-preview"
        className="mt-16 w-full px-3 pb-24 sm:mt-20 sm:px-4 sm:pb-28"
      >
        <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_16px_48px_rgba(17,17,17,0.08)] sm:rounded-[22px]">
          <ProductPreview framed={false} />
        </div>
      </div>
    </section>
  );
}
