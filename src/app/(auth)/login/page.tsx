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
import { mockLogin } from "@/lib/mockAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await mockLogin(email, password);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      router.push("/");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Dueso workspace."
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

        <AuthField id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Your password"
            error={Boolean(errors.password)}
          />
        </AuthField>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-muted hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>

        <AuthFormError message={errors.form} />

        <AuthButton loading={loading}>Log in</AuthButton>

        <AuthDivider />

        <AuthButton
          type="button"
          variant="google"
          onClick={() =>
            setErrors({ form: "Google sign-in coming soon." })
          }
        >
          <GoogleIcon />
          Continue with Google
        </AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-ink hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
