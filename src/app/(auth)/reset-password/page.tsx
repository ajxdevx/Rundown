"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AuthButton,
  AuthField,
  AuthFormError,
  AuthShell,
  PasswordInput,
} from "@/components/auth/AuthUI";
import { mockResetPassword } from "@/lib/mockAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const result = await mockResetPassword(password, confirm);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      router.push("/login");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password for your Dueso workspace."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField id="password" label="New password" error={errors.password}>
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

        <AuthFormError message={errors.form} />

        <AuthButton loading={loading}>Update password</AuthButton>
      </form>
    </AuthShell>
  );
}
