"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthButton,
  AuthFormError,
  AuthShell,
} from "@/components/auth/AuthUI";
import {
  getPendingEmail,
  getSession,
  mockResendEmail,
  mockVerifyEmail,
} from "@/lib/mockAuth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(getPendingEmail() || getSession()?.email || "your@email.com");
  }, []);

  const verify = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await mockVerifyEmail();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await mockResendEmail();
      setResent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle="We've sent a verification link to your email."
    >
      <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
        <p className="text-4xl" aria-hidden>
          📩
        </p>
        <p className="mt-4 text-sm font-medium text-ink">{email}</p>
      </div>

      <div className="mt-6 space-y-3">
        <AuthFormError message={error} />
        {resent ? (
          <p className="text-center text-sm text-emerald-600">
            Verification email resent.
          </p>
        ) : null}

        <AuthButton loading={loading} onClick={verify} type="button">
          Open email
        </AuthButton>
        <AuthButton
          type="button"
          variant="secondary"
          loading={resending}
          onClick={resend}
        >
          Resend email
        </AuthButton>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Didn&apos;t receive it? Check your spam folder.
      </p>

      <p className="mt-4 text-center text-xs text-muted">
        For this UI preview, &quot;Open email&quot; verifies and continues.
      </p>
    </AuthShell>
  );
}
