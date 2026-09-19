"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthButton,
  AuthField,
  AuthFormError,
  AuthShell,
  authInputClass,
  authInputError,
} from "@/components/auth/AuthUI";
import { mockForgotPassword } from "@/lib/mockAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await mockForgotPassword(email);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've sent instructions to reset your password."
      >
        <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
          <p className="text-4xl" aria-hidden>
            📩
          </p>
          <p className="mt-4 text-sm font-medium text-ink">{email}</p>
        </div>
        <div className="mt-6 space-y-3">
          <AuthButton
            type="button"
            onClick={() => router.push("/reset-password")}
          >
            Continue to reset
          </AuthButton>
          <Link
            href="/login"
            className="block text-center text-sm font-medium text-muted hover:text-ink"
          >
            Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={`${authInputClass} ${errors.email ? authInputError : ""}`}
          />
        </AuthField>

        <AuthFormError message={errors.form} />

        <AuthButton loading={loading}>Send reset link</AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
