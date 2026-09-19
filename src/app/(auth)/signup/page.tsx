"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthFormError,
  AuthShell,
  PasswordInput,
  authInputClass,
  authInputError,
} from "@/components/auth/AuthUI";
import { mockSignUp } from "@/lib/mockAuth";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await mockSignUp({
        name,
        email,
        password,
        confirm,
        terms,
      });
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      router.push("/verify-email");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your Dueso workspace"
      subtitle="Start managing your client projects in one place."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField id="name" label="Full name" error={errors.name}>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            autoComplete="name"
            className={`${authInputClass} ${errors.name ? authInputError : ""}`}
          />
        </AuthField>

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

        <AuthField id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            error={Boolean(errors.password)}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField
          id="confirm"
          label="Confirm password"
          error={errors.confirm}
        >
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat password"
            error={Boolean(errors.confirm)}
            autoComplete="new-password"
          />
        </AuthField>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 size-4 rounded border-border accent-ink"
            />
            <span className="text-sm text-muted">
              I agree to the{" "}
              <button
                type="button"
                className="font-medium text-ink underline"
              >
                Terms
              </button>
            </span>
          </label>
          {errors.terms ? (
            <p className="mt-1.5 text-xs text-red-500" role="alert">
              {errors.terms}
            </p>
          ) : null}
        </div>

        <AuthFormError message={errors.form} />

        <AuthButton loading={loading}>Create account</AuthButton>

        <AuthDivider />

        <AuthButton
          type="button"
          variant="google"
          onClick={() =>
            setErrors({ form: "Google sign-in coming soon." })
          }
        >
          Continue with Google
        </AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
