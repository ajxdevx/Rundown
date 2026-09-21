"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthButton,
  AuthField,
  AuthShell,
  OnboardingProgress,
  authInputClass,
} from "@/components/auth/AuthUI";
import Dropdown from "@/components/Dropdown";
import {
  completeOnboarding,
  getSession,
  updateOnboarding,
  type WorkspaceRole,
} from "@/lib/mockAuth";

const ROLES: WorkspaceRole[] = [
  "Freelancer",
  "Agency",
  "Studio",
  "Consultant",
  "Other",
];

const CURRENCIES = ["USD", "EUR", "GBP", "MAD", "CAD", "AUD"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState<WorkspaceRole | "">("");
  const [businessName, setBusinessName] = useState("");
  const [brandColor, setBrandColor] = useState("#C8FF3D");
  const [currency, setCurrency] = useState("USD");
  const [defaultStatus, setDefaultStatus] = useState<"active" | "draft">(
    "active",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/signup");
      return;
    }
    if (!session.verified) {
      router.replace("/verify-email");
      return;
    }
    if (session.onboardingComplete) {
      router.replace("/dashboard");
      return;
    }
    setName(session.onboarding.name || session.name);
    setRole(session.onboarding.role);
    setBusinessName(session.onboarding.businessName);
    setBrandColor(session.onboarding.brandColor || "#C8FF3D");
    setCurrency(session.onboarding.currency || "USD");
    setDefaultStatus(session.onboarding.defaultProjectStatus || "active");
  }, [router]);

  const nextFromAbout = () => {
    setError("");
    if (!name.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!role) {
      setError("Please select what you do.");
      return;
    }
    updateOnboarding({ name: name.trim(), role });
    setStep(2);
  };

  const nextFromWorkspace = () => {
    setError("");
    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    updateOnboarding({ businessName: businessName.trim(), brandColor });
    setStep(3);
  };

  const nextFromPreferences = () => {
    updateOnboarding({ currency, defaultProjectStatus: defaultStatus });
    setStep(4);
  };

  const finish = (createProject: boolean) => {
    completeOnboarding();
    if (createProject) router.push("/projects/new");
    else router.push("/dashboard");
  };

  if (step === 4) {
    return (
      <AuthShell
        title="Ready to create your first project?"
        subtitle="Create a project, invite your client, and give them a dedicated portal."
      >
        <div className="space-y-3">
          <AuthButton type="button" onClick={() => finish(true)}>
            Create First Project
          </AuthButton>
          <AuthButton
            type="button"
            variant="secondary"
            onClick={() => finish(false)}
          >
            I&apos;ll do this later
          </AuthButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-10 sm:px-8">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Dueso"
            width={40}
            height={40}
            className="size-10 object-contain"
            unoptimized
          />
          <span className="font-[family-name:var(--font-brand)] text-lg font-bold tracking-tight text-ink">
            Dueso
          </span>
        </Link>

        <OnboardingProgress step={step} total={3} />

        {step === 1 && (
          <>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Let&apos;s set up your workspace
            </h1>
            <p className="mt-2 text-sm text-muted">
              A few details so Dueso feels like yours.
            </p>

            <div className="mt-8 space-y-5">
              <AuthField id="ob-name" label="Your name">
                <input
                  id="ob-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className={authInputClass}
                />
              </AuthField>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  What do you do?
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-10 cursor-pointer rounded-xl px-4 text-sm font-medium transition-colors ${
                        role === r
                          ? "bg-ink text-card"
                          : "border border-border bg-card text-muted hover-soft"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  For personalization only — Dueso works for every type of
                  workspace.
                </p>
              </div>

              {error ? (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              ) : null}

              <AuthButton type="button" onClick={nextFromAbout}>
                Continue
              </AuthButton>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              What&apos;s your business called?
            </h1>
            <p className="mt-2 text-sm text-muted">
              This appears on your client portal.
            </p>

            <div className="mt-8 space-y-5">
              <AuthField id="business" label="Business name">
                <input
                  id="business"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className={authInputClass}
                />
              </AuthField>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Logo{" "}
                  <span className="font-normal text-muted">optional</span>
                </p>
                <button
                  type="button"
                  className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-sm text-muted hover-soft"
                >
                  Upload logo
                </button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Brand color{" "}
                  <span className="font-normal text-muted">optional</span>
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="size-12 cursor-pointer rounded-xl border border-border bg-card p-1"
                    aria-label="Brand color"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className={`${authInputClass} flex-1 font-mono uppercase`}
                  />
                </div>
              </div>

              {error ? (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex gap-2">
                <AuthButton
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  Back
                </AuthButton>
                <AuthButton type="button" onClick={nextFromWorkspace}>
                  Continue
                </AuthButton>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Set your preferences
            </h1>
            <p className="mt-2 text-sm text-muted">
              You can change these anytime in Settings.
            </p>

            <div className="mt-8 space-y-5">
              <AuthField id="currency" label="Currency">
                <Dropdown
                  id="currency"
                  aria-label="Currency"
                  value={currency}
                  onChange={setCurrency}
                  options={CURRENCIES}
                />
              </AuthField>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Default project status
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { id: "active", label: "Active" },
                      { id: "draft", label: "Draft" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDefaultStatus(opt.id)}
                      className={`h-10 flex-1 cursor-pointer rounded-xl text-sm font-medium ${
                        defaultStatus === opt.id
                          ? "bg-ink text-card"
                          : "border border-border bg-card text-muted hover-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <AuthButton
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                >
                  Back
                </AuthButton>
                <AuthButton type="button" onClick={nextFromPreferences}>
                  Continue
                </AuthButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
