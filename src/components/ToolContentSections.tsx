"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ToolContent, ToolFaqItem } from "@/data/tools";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-300 sm:text-base">
      {text}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-zinc-700/60 bg-[#141414] px-4 py-3 text-sm leading-relaxed text-zinc-300"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function FaqItem({ item }: { item: ToolFaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left hover-soft"
      >
        <span className="min-w-0 text-sm font-semibold text-white">
          {item.question || "Question"}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : "rotate-0"
          }`}
          strokeWidth={2}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {item.answer ? (
            <p className="border-t border-zinc-800 px-4 pt-3 pb-4 text-sm leading-relaxed text-zinc-300">
              {item.answer}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ToolContentSectionsProps = {
  content: ToolContent | null | undefined;
};

export function getToolContentNavSections(
  content: ToolContent | null | undefined,
): { id: string; label: string }[] {
  if (!content) return [];

  const sections: { id: string; label: string }[] = [];
  if (content.about) sections.push({ id: "about", label: "About" });
  if (content.whatIsIt) sections.push({ id: "what-is-it", label: "What is it?" });
  if (content.whoIsItFor)
    sections.push({ id: "who-is-it-for", label: "Who is it for?" });
  if (content.howItWorks)
    sections.push({ id: "how-it-works", label: "How it works" });
  if (content.pricingDetails)
    sections.push({ id: "pricing-details", label: "Pricing details" });
  if (content.pros.length > 0 || content.cons.length > 0) {
    sections.push({ id: "pros-cons", label: "Pros & Cons" });
  }
  if (content.honestReview)
    sections.push({ id: "honest-review", label: "Honest review" });
  if (content.faq.length > 0) sections.push({ id: "faq", label: "FAQ" });
  return sections;
}

export default function ToolContentSections({
  content,
}: ToolContentSectionsProps) {
  if (!content) return null;

  return (
    <>
      {content.about ? (
        <Section id="about" title="About">
          <Prose text={content.about} />
        </Section>
      ) : null}

      {content.whatIsIt ? (
        <Section id="what-is-it" title="What is it?">
          <Prose text={content.whatIsIt} />
        </Section>
      ) : null}

      {content.whoIsItFor ? (
        <Section id="who-is-it-for" title="Who is it for?">
          <Prose text={content.whoIsItFor} />
        </Section>
      ) : null}

      {content.howItWorks ? (
        <Section id="how-it-works" title="How it works">
          <Prose text={content.howItWorks} />
        </Section>
      ) : null}

      {content.pricingDetails ? (
        <Section id="pricing-details" title="Pricing details">
          <Prose text={content.pricingDetails} />
        </Section>
      ) : null}

      {content.pros.length > 0 || content.cons.length > 0 ? (
        <section id="pros-cons" className="mt-10 scroll-mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {content.pros.length > 0 ? (
              <div>
                <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-emerald-400 uppercase">
                  Pros
                </h2>
                <BulletList items={content.pros} />
              </div>
            ) : null}
            {content.cons.length > 0 ? (
              <div>
                <h2 className="mb-3 font-mono text-xs font-medium tracking-wide text-red-400 uppercase">
                  Cons
                </h2>
                <BulletList items={content.cons} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {content.honestReview ? (
        <Section id="honest-review" title="Honest review">
          <Prose text={content.honestReview} />
        </Section>
      ) : null}

      {content.faq.length > 0 ? (
        <Section id="faq" title="FAQ">
          <div className="space-y-3">
            {content.faq.map((item) => (
              <FaqItem
                key={`${item.question}-${item.answer.slice(0, 24)}`}
                item={item}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
