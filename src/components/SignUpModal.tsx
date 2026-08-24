"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { FaGoogle } from "react-icons/fa6";
import { featuredTools, tools, type Tool } from "@/data/tools";
import { mapAuthError } from "@/lib/authErrors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import Popup from "./Popup";

type AuthMode = "signup" | "login";
type AuthStep = "email" | "password";

type SignUpModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
};

const showcaseTools = [...featuredTools, ...tools].slice(0, 10);

function ToolPreviewCard({ tool }: { tool: Tool }) {
  return (
    <article className="signup-tool-card shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-[#121212] shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
      <div
        className="relative h-24 w-full"
        style={{ backgroundColor: tool.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/20 select-none">
          {tool.initial}
        </span>
        <span className="absolute top-3 left-3 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-300 uppercase backdrop-blur-sm">
          {tool.category}
        </span>
      </div>
      <div className="flex items-center gap-3 p-3.5">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: tool.color }}
        >
          {tool.initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{tool.name}</p>
          <p className="truncate text-xs text-zinc-500">{tool.description}</p>
        </div>
      </div>
    </article>
  );
}

const inputClassName =
  "h-12 w-full rounded-xl border border-zinc-700/70 bg-[#111111] px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-60";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SignUpModal({
  open,
  onClose,
  initialMode = "signup",
}: SignUpModalProps) {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(false);
  const submittingRef = useRef(false);

  const emailOk = isValidEmail(email);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setMode(initialMode);
      setStep("email");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setMessage(null);
      setError(null);
      setLoading(false);
      submittingRef.current = false;
      const t = setTimeout(() => emailRef.current?.focus(), 20);
      prevOpen.current = true;
      return () => clearTimeout(t);
    }
    if (!open) prevOpen.current = false;
  }, [open, initialMode]);

  function handleEmailContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!emailOk) {
      setError("Enter a valid email address.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setStep("password");
    setTimeout(() => passwordRef.current?.focus(), 20);
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || submittingRef.current) return;

    setMessage(null);
    setError(null);

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (authError) {
          setError(mapAuthError(authError));
          return;
        }

        if (data.user && !data.session) {
          setMessage(
            "Account created. Check your email to confirm, then log in.",
          );
          return;
        }

        await refreshProfile();
        onClose();
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(mapAuthError(authError));
        return;
      }

      await refreshProfile();
      onClose();
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err : "Network error"));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const loop = [...showcaseTools, ...showcaseTools];
  const loopAlt = [
    ...showcaseTools.slice(3),
    ...showcaseTools.slice(0, 3),
    ...showcaseTools.slice(3),
    ...showcaseTools.slice(0, 3),
  ];

  const isSignup = mode === "signup";
  const isPasswordStep = step === "password";

  const title = isPasswordStep
    ? isSignup
      ? "Create a password"
      : "Enter your password"
    : isSignup
      ? "Create your free account"
      : "Welcome back";

  const subtitle = isPasswordStep
    ? isSignup
      ? "Choose a password, then confirm it to finish signing up."
      : "Enter and confirm your password to log in."
    : isSignup
      ? "Discover and save the best AI tools — curated for builders, creators, and teams."
      : "Log in to save tools and access your account features.";

  return (
    <Popup
      open={open}
      onClose={onClose}
      labelledBy="signup-title"
      showCloseButton
      panelClassName="flex h-[min(520px,85vh)] w-full max-w-4xl bg-[#0a0a0a] shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
    >
      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-12 md:w-[46%]">
        <div className="mx-auto w-full max-w-[340px] text-center">
          <div className="mx-auto mb-1 flex items-center justify-center gap-1.5 leading-none">
            <Image
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 object-contain"
              unoptimized
            />
            <span className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-white">
              Rundown
            </span>
          </div>

          <h2
            id="signup-title"
            className="mb-1.5 whitespace-nowrap font-[family-name:var(--font-brand)] text-[1.45rem] leading-none font-bold tracking-tight text-white sm:text-[1.65rem]"
          >
            {title}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-zinc-500">{subtitle}</p>

          {isPasswordStep ? (
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-3"
            >
              <input
                type="email"
                readOnly
                tabIndex={-1}
                value={email.trim()}
                aria-label="Email address"
                className={`${inputClassName} cursor-default text-zinc-300`}
              />
              <input
                ref={passwordRef}
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
                placeholder="Password"
              />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
                placeholder="Confirm password"
              />

              <button
                type="submit"
                disabled={
                  loading || password.length < 6 || confirmPassword.length < 6
                }
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? isSignup
                    ? "Creating account…"
                    : "Logging in…"
                  : isSignup
                    ? "Sign up"
                    : "Log in"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setMessage(null);
                  setTimeout(() => emailRef.current?.focus(), 20);
                }}
                className="cursor-pointer text-sm font-medium text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Use a different email
              </button>

              {error && (
                <p className="text-left text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-left text-sm text-emerald-400" role="status">
                  {message}
                </p>
              )}
            </form>
          ) : (
            <>
              <form
                onSubmit={handleEmailContinue}
                className="flex flex-col gap-3"
              >
                <input
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={inputClassName}
                  placeholder="Email address"
                />

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    emailOk
                      ? "grid-rows-[1fr] opacity-100"
                      : "pointer-events-none grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <button
                      type="submit"
                      tabIndex={emailOk ? 0 : -1}
                      className={`flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90 ${
                        emailOk ? "animate-continue-btn" : ""
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-left text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs font-medium tracking-wide text-zinc-600 uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-zinc-800" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  // Placeholder — Google auth wiring comes later.
                }}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-zinc-700/70 bg-[#111111] text-sm font-semibold text-white transition-colors duration-200 hover:border-zinc-500 hover:bg-[#161616] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaGoogle className="size-4 shrink-0" />
                Continue with Google
              </button>

              <p className="mt-5 text-sm text-zinc-500">
                {isSignup ? "Already have an account?" : "Need an account?"}{" "}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode(isSignup ? "login" : "signup");
                    setStep("email");
                    setPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setMessage(null);
                  }}
                  className="cursor-pointer font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSignup ? "Log in" : "Sign up"}
                </button>
              </p>

              <p className="mt-6 whitespace-nowrap text-[11px] leading-relaxed text-zinc-600">
                By continuing you agree to our{" "}
                <span className="text-zinc-400 underline underline-offset-2">
                  Terms
                </span>{" "}
                and{" "}
                <span className="text-zinc-400 underline underline-offset-2">
                  Privacy
                </span>
                .
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-zinc-800/80 bg-[#070707] md:block md:w-[54%]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#070707] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#070707] to-transparent" />

        <div className="absolute inset-0 flex gap-4 px-6 py-4">
          <div className="signup-tools-marquee flex w-1/2 flex-col gap-3">
            {loop.map((tool, i) => (
              <ToolPreviewCard key={`up-${tool.id}-${i}`} tool={tool} />
            ))}
          </div>
          <div className="signup-tools-marquee-down mt-[-30%] flex w-1/2 flex-col gap-3">
            {loopAlt.map((tool, i) => (
              <ToolPreviewCard key={`down-${tool.id}-${i}`} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </Popup>
  );
}
