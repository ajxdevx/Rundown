"use client";

import { useEffect } from "react";
import { trackLanding } from "@/lib/landingAnalytics";
import { AnnouncementBar } from "./AnnouncementBar";
import { AudienceSelector } from "./AudienceSelector";
import { BusinessClientConcept } from "./BusinessClientConcept";
import { InteractiveDemoContainer } from "./demo";
import { FaqSection } from "./FaqSection";
import { FinalCta, MarketingFooter } from "./Footer";
import { Hero } from "./Hero";
import { MarketingNavbar } from "./MarketingNavbar";
import { Reveal } from "./motion/Reveal";
import { WaitlistSection } from "./WaitlistSection";
import { WaitlistProvider } from "./waitlist";
import { WorkflowSection } from "./WorkflowSection";

export function LandingPage() {
  useEffect(() => {
    trackLanding("page_view");
  }, []);

  return (
    <WaitlistProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-card"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <MarketingNavbar />
      <main id="main-content">
        <Hero />
        <Reveal>
          <InteractiveDemoContainer />
        </Reveal>
        <Reveal>
          <AudienceSelector />
        </Reveal>
        <Reveal>
          <BusinessClientConcept />
        </Reveal>
        <Reveal>
          <WorkflowSection />
        </Reveal>
        <Reveal>
          <WaitlistSection />
        </Reveal>
        <FaqSection />
        <Reveal>
          <FinalCta />
        </Reveal>
      </main>
      <MarketingFooter />
    </WaitlistProvider>
  );
}
