"use client";

import { Loader2 } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { submitWaitlist } from "@/lib/waitlist/client";
import type {
  WaitlistAudience,
  WaitlistSource,
  WaitlistUtm,
} from "@/lib/waitlist/types";
import { WAITLIST_AUDIENCES } from "@/lib/waitlist/types";
import { getStoredUtm } from "@/lib/waitlist/utm";
import { validateEmail } from "@/lib/waitlist/validate";
import { trackLanding } from "@/lib/landingAnalytics";
import { FieldMessage } from "../ui/FieldMessage";
import { Cta } from "../Cta";
import { AppCheckbox } from "@/components/ui/AppCheckbox";

type FormPhase = "idle" | "success" | "duplicate";

type WaitlistFormProps = {
  source: WaitlistSource;
  variant?: "inline" | "modal";
  idPrefix?: string;
  onSuccess?: () => void;
  className?: string;
};

export function WaitlistForm({
  source,
  variant = "inline",
  idPrefix,
  onSuccess,
  className = "",
}: WaitlistFormProps) {
  const reactId = useId();
  const prefix = idPrefix ?? `wl-${reactId}`;
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState<WaitlistAudience | "">("");
  const [consent, setConsent] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<FormPhase>("idle");
  const startedRef = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackLanding("waitlist_form_started", { source });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setConsentError(null);

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);

    if (!consent) {
      setConsentError(
        "Please confirm you want to receive early access updates.",
      );
      return;
    }

    setSubmitting(true);
    trackLanding("waitlist_form_submitted", {
      source,
      has_audience: Boolean(audience),
    });

    const utm: WaitlistUtm = getStoredUtm();
    const result = await submitWaitlist({
      email,
      audience,
      source,
      consent,
      companyWebsite: honeypot,
      utm,
    });

    setSubmitting(false);

    if (!result.ok) {
      trackLanding("waitlist_signup_failed", {
        source,
        status: result.status,
      });
      if (result.field === "email") {
        setEmailError(result.message);
        emailRef.current?.focus();
      } else if (result.field === "consent") {
        setConsentError(result.message);
      } else {
        setFormError(result.message);
      }
      return;
    }

    if (result.status === "duplicate") {
      trackLanding("waitlist_signup_duplicate", { source });
      setPhase("duplicate");
    } else {
      trackLanding("waitlist_signup_succeeded", {
        source,
        audience: audience || "none",
      });
      trackLanding("waitlist_complete", { source });
      setPhase("success");
    }
    onSuccess?.();
  };

  if (phase === "success" || phase === "duplicate") {
    const duplicate = phase === "duplicate";
    return (
      <div
        className={className}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-base font-semibold text-ink">
          {duplicate ? "You're already on the list." : "You're on the list."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {duplicate
            ? "We'll keep you posted when Dueso is ready for early access."
            : "Thanks for joining Dueso early access. We'll keep you posted as we get closer to launch."}
        </p>
        {variant === "modal" ? (
          <p className="mt-3 text-xs text-muted-soft">You can close this now.</p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className} noValidate>
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`${prefix}-email`}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            ref={emailRef}
            id={`${prefix}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
              markStarted();
            }}
            placeholder="you@example.com"
            aria-invalid={Boolean(emailError)}
            aria-describedby={
              emailError ? `${prefix}-email-error` : undefined
            }
            disabled={submitting}
            className={`input-field ${
              emailError ? "border-danger focus:border-danger" : ""
            }`}
          />
          {emailError ? (
            <FieldMessage id={`${prefix}-email-error`}>
              {emailError}
            </FieldMessage>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`${prefix}-audience`}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            What best describes you?{" "}
            <span className="font-normal text-muted-soft">(optional)</span>
          </label>
          <select
            id={`${prefix}-audience`}
            name="audience"
            value={audience}
            onChange={(e) => {
              const next = e.target.value as WaitlistAudience | "";
              setAudience(next);
              markStarted();
              if (next) {
                trackLanding("waitlist_audience_selected", {
                  source,
                  audience: next,
                });
              }
            }}
            disabled={submitting}
            className="input-field"
          >
            <option value="">Select one…</option>
            {WAITLIST_AUDIENCES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Honeypot */}
        <div
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
          aria-hidden
        >
          <label htmlFor={`${prefix}-company`}>Company website</label>
          <input
            id={`${prefix}-company`}
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
            <button
              type="button"
              role="checkbox"
              aria-checked={consent}
              disabled={submitting}
              onClick={() => {
                setConsent((v) => !v);
                if (consentError) setConsentError(null);
                markStarted();
              }}
              className="mt-0.5 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-60"
              aria-invalid={Boolean(consentError)}
              aria-describedby={
                consentError ? `${prefix}-consent-error` : `${prefix}-consent-hint`
              }
            >
              <AppCheckbox checked={consent} size="sm" />
            </button>
            <span>
              By joining, you agree to receive updates about Dueso and early
              access.{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-ink"
              >
                Privacy
              </a>
            </span>
          </label>
          <p id={`${prefix}-consent-hint`} className="sr-only">
            Consent to receive early access updates.
          </p>
          {consentError ? (
            <FieldMessage id={`${prefix}-consent-error`}>
              {consentError}
            </FieldMessage>
          ) : null}
        </div>

        {formError ? (
          <div
            className="rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft/40 px-3 py-2.5"
            role="alert"
          >
            <p className="text-sm font-medium text-ink">
              We couldn&apos;t add you right now.
            </p>
            <p className="mt-0.5 text-xs text-muted">{formError}</p>
          </div>
        ) : null}

        <div
          className={
            variant === "inline"
              ? "flex flex-col gap-3 sm:flex-row sm:items-center"
              : ""
          }
        >
          <Cta
            type="submit"
            size={variant === "modal" ? "lg" : "md"}
            className={
              variant === "inline" ? "w-full sm:w-auto" : "w-full"
            }
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Joining…
              </>
            ) : (
              "Join Waitlist"
            )}
          </Cta>
        </div>
      </div>
    </form>
  );
}

/** Expose dirty check for modal discard confirm */
export function waitlistFormHasInput(email: string, audience: string) {
  return Boolean(email.trim() || audience);
}
