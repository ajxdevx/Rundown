"use client";

import Image from "next/image";
import Link from "next/link";
import { trackLanding } from "@/lib/landingAnalytics";
import { scrollToId } from "@/lib/landingScroll";
import { Cta } from "./Cta";
import { JoinWaitlistButton, useWaitlist } from "./waitlist";

export function FinalCta() {
  return (
    <section
      className="landing-section border-t border-border/60"
      aria-labelledby="final-cta-heading"
    >
      <div className="landing-shell text-center">
        <h2
          id="final-cta-heading"
          className="font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          Ready when you are.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-muted">
          Explore the product, or join the Dueso early access list and help
          shape it from the start.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <JoinWaitlistButton source="final_cta" size="lg">
            Join Waitlist
          </JoinWaitlistButton>
          <Cta
            variant="secondary"
            size="lg"
            onClick={() => {
              trackLanding("explore_product");
              scrollToId("product");
            }}
          >
            Explore Dueso
          </Cta>
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  const { openWaitlist } = useWaitlist();

  return (
    <footer className="border-t border-border bg-background">
      <div className="landing-shell flex flex-col gap-10 py-12 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
              unoptimized
            />
            <span className="font-[family-name:var(--font-brand)] text-base font-semibold tracking-tight text-ink">
              Dueso
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-base leading-relaxed text-muted">
            Projects, made simple — for freelancers, agencies, studios, and
            modern service businesses.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 text-base">
          <div>
            <p className="font-medium text-ink">Product</p>
            <ul className="mt-3 space-y-2.5 text-muted">
              <li>
                <button
                  type="button"
                  className="hover:text-ink"
                  onClick={() => scrollToId("product")}
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hover:text-ink"
                  onClick={() => scrollToId("client-portal")}
                >
                  Client Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hover:text-ink"
                  onClick={() => openWaitlist("footer")}
                >
                  Join Waitlist
                </button>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-ink">Account</p>
            <ul className="mt-3 space-y-2.5 text-muted">
              <li>
                <Link href="/login" className="hover:text-ink">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="landing-shell flex flex-col gap-2 py-5 text-sm text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Dueso. All rights reserved.</p>
          <p>Early access — building in public.</p>
        </div>
      </div>
    </footer>
  );
}
