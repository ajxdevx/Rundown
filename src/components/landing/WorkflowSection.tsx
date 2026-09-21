import { landingWorkflowSteps } from "@/data/landingDemo";
import { SectionHeader } from "./SectionHeader";

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="landing-section scroll-mt-24 border-t border-border/60"
      aria-labelledby="workflow-heading"
    >
      <div className="landing-shell">
        <SectionHeader
          id="workflow-heading"
          eyebrow="How it works"
          title="From internal work to client-ready"
          description="Dueso connects your workspace to a professional client experience — without mixing the two."
        />

        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {landingWorkflowSteps.map((step, index) => (
            <li key={step.id} className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-soft sm:text-sm">
                Step {index + 1}
              </p>
              <h3 className="mt-2.5 text-lg font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-2.5 text-base leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
