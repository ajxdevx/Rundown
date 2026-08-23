"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { featuredTools, tools, type Tool } from "@/data/tools";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";
import Popup from "./Popup";

type AuthMode = "signup" | "login";
type AuthStep = "credentials" | "username";

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

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export default function SignUpModal({
  open,
  onClose,
  initialMode = "signup",
}: SignUpModalProps) {
  const { needsUsername, refreshProfile } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current) {
      const startOnUsername = needsUsername;
      setMode(initialMode);
      setStep(startOnUsername ? "username" : "credentials");
      setEmail("");
      setPassword("");
      setUsername("");
      setMessage(null);
      setError(null);
      const t = setTimeout(() => {
        if (startOnUsername) usernameRef.current?.focus();
        else emailRef.current?.focus();
      }, 20);
      prevOpen.current = true;
      return () => clearTimeout(t);
    }
    if (!open) prevOpen.current = false;
  }, [open, initialMode, needsUsername]);

  useEffect(() => {
    if (open && needsUsername && step !== "username") {
      setStep("username");
      setError(null);
      setMessage(null);
    }
  }, [open, needsUsername, step]);

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user && !data.session) {
        setMessage("Account created. Check your email to confirm, then log in.");
        return;
      }

      setUsername("");
      setStep("username");
      setTimeout(() => usernameRef.current?.focus(), 20);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    const profile = await refreshProfile();
    if (!profile?.username) {
      setUsername("");
      setStep("username");
      setTimeout(() => usernameRef.current?.focus(), 20);
      return;
    }

    onClose();
  }

  async function handleUsernameSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeUsername(username);
    if (!normalized) {
      setError("Please choose a username.");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setError("Use 3–20 characters: letters, numbers, or underscores.");
      return;
    }

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      setError(userError?.message ?? "You must be signed in to continue.");
      return;
    }

    setLoading(true);

    const { data: taken, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalized)
      .neq("id", currentUser.id)
      .maybeSingle();

    if (checkError) {
      setLoading(false);
      setError(checkError.message);
      return;
    }

    if (taken) {
      setLoading(false);
      setError("That username is already taken.");
      return;
    }

    const { error: saveError } = await supabase.from("profiles").upsert(
      {
        id: currentUser.id,
        username: normalized,
      },
      { onConflict: "id" },
    );

    setLoading(false);

    if (saveError) {
      if (saveError.code === "23505") {
        setError("That username is already taken.");
        return;
      }
      setError(saveError.message);
      return;
    }

    await refreshProfile();
    onClose();
  }

  const loop = [...showcaseTools, ...showcaseTools];
  const loopAlt = [
    ...showcaseTools.slice(3),
    ...showcaseTools.slice(0, 3),
    ...showcaseTools.slice(3),
    ...showcaseTools.slice(0, 3),
  ];

  const isSignup = mode === "signup";
  const isUsernameStep = step === "username";
  const canClose = !needsUsername && !isUsernameStep;

  return (
    <Popup
      open={open}
      onClose={() => {
        if (!canClose) return;
        onClose();
      }}
      labelledBy="signup-title"
      showCloseButton={canClose}
      panelClassName="flex h-[min(520px,85vh)] w-full max-w-4xl bg-[#0a0a0a] shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
    >
      <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-12 md:w-[46%]">
        <div className="mx-auto w-full max-w-[340px] text-center">
          <div className="mx-auto mb-8 flex size-12 items-center justify-center overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt="Rundown"
              width={48}
              height={48}
              className="size-12 object-contain"
              unoptimized
            />
          </div>

          <h2
            id="signup-title"
            className="mb-3 whitespace-nowrap font-[family-name:var(--font-brand)] text-[1.45rem] leading-tight font-bold tracking-tight text-white sm:text-[1.65rem]"
          >
            {isUsernameStep
              ? "Choose your username"
              : isSignup
                ? "Create your free account"
                : "Welcome back"}
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-zinc-500">
            {isUsernameStep
              ? "Pick a unique username for your Rundown profile."
              : isSignup
                ? "Discover and save the best AI tools — curated for builders, creators, and teams."
                : "Log in to save tools and access your account features."}
          </p>

          {isUsernameStep ? (
            <form
              onSubmit={handleUsernameSubmit}
              className="flex flex-col gap-3"
            >
              <input
                ref={usernameRef}
                type="text"
                required
                autoComplete="username"
                value={username}
                disabled={loading}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClassName}
                placeholder="Username"
                maxLength={20}
              />

              <button
                type="submit"
                disabled={loading || !normalizeUsername(username)}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving…" : "Continue"}
              </button>

              {error && (
                <p className="text-left text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
            </form>
          ) : (
            <>
              <form
                onSubmit={handleCredentialsSubmit}
                className="flex flex-col gap-3"
              >
                <input
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClassName}
                  placeholder="Email address"
                />
                <input
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
                <button type="submit" className="sr-only" tabIndex={-1}>
                  {isSignup ? "Sign up" : "Log in"}
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
                {loading && !message && !error && (
                  <p className="text-left text-sm text-zinc-500" role="status">
                    {isSignup ? "Creating account…" : "Logging in…"}
                  </p>
                )}
              </form>

              <p className="mt-5 text-sm text-zinc-500">
                {isSignup ? "Already have an account?" : "Need an account?"}{" "}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode(isSignup ? "login" : "signup");
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
