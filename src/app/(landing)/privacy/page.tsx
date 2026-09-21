import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Dueso handles early access waitlist information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-ink">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          ← Back to Dueso
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-brand)] text-3xl font-semibold tracking-tight">
          Privacy
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          When you join the Dueso early access waitlist, we collect your email
          address and, if you choose to share it, how you describe your work
          (for example freelancer or agency). We use this information only to
          contact you about Dueso early access and related product updates.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          We do not sell your information. You can ask to be removed from the
          list at any time by contacting us through the email you used to join.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This page will expand as Dueso approaches public launch. For
          questions, reach out via the waitlist confirmation channel once we
          write to you.
        </p>
      </div>
    </div>
  );
}
