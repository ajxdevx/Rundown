"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearSession,
  getSession,
  type MockSession,
} from "@/lib/mockAuth";

export type Profile = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
  role: string | null;
};

export type AuthStatus = "loading" | "authenticated" | "loggedOut";

type StubUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    profile_setup_completed?: boolean;
  };
};

type AuthContextValue = {
  user: StubUser | null;
  profile: Profile | null;
  authLoading: boolean;
  loading: boolean;
  status: AuthStatus;
  needsOnboarding: boolean;
  needsUsername: boolean;
  needsProfileSetup: boolean;
  refreshProfile: () => Promise<Profile | null>;
  applyOptimisticProfile: (next: Profile) => void;
  applyOptimisticSetupComplete: (complete: boolean) => void;
  markProfileSetupComplete: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read session from storage (after login/signup). */
  syncSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToUser(session: MockSession): StubUser {
  return {
    id: "mock-user",
    email: session.email,
    user_metadata: {
      full_name: session.onboarding.name || session.name,
      name: session.onboarding.name || session.name,
      profile_setup_completed: session.onboardingComplete,
    },
  };
}

function sessionToProfile(session: MockSession): Profile {
  const name = session.onboarding.name || session.name;
  return {
    username: name.split(/\s+/)[0]?.toLowerCase() || "user",
    avatar_url: null,
    bio: null,
    display_name: name,
    role: session.onboarding.role || null,
  };
}

/** Dev fallback so existing UI pages still work without logging in. */
const DEV_FALLBACK_USER: StubUser = {
  id: "ui-dev-user",
  email: "alex@example.com",
  user_metadata: {
    full_name: "Alex",
    name: "Alex",
    profile_setup_completed: true,
  },
};

const DEV_FALLBACK_PROFILE: Profile = {
  username: "alex",
  avatar_url: null,
  bio: null,
  display_name: "Alex",
  role: "Freelancer",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<MockSession | null>(null);
  const [ready, setReady] = useState(false);

  const syncSession = useCallback(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    syncSession();
    setReady(true);
  }, [syncSession]);

  const refreshProfile = useCallback(async () => {
    const s = getSession();
    setSessionState(s);
    return s ? sessionToProfile(s) : DEV_FALLBACK_PROFILE;
  }, []);

  const applyOptimisticProfile = useCallback((_next: Profile) => {}, []);
  const applyOptimisticSetupComplete = useCallback((_complete: boolean) => {}, []);
  const markProfileSetupComplete = useCallback(async () => {}, []);

  const signOut = useCallback(async () => {
    clearSession();
    setSessionState(null);
  }, []);

  const hasSession = Boolean(session?.verified && session?.onboardingComplete);
  const user = hasSession
    ? sessionToUser(session!)
    : ready
      ? DEV_FALLBACK_USER
      : null;
  const profile = hasSession
    ? sessionToProfile(session!)
    : ready
      ? DEV_FALLBACK_PROFILE
      : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      authLoading: !ready,
      loading: !ready,
      status: !ready ? "loading" : "authenticated",
      needsOnboarding: false,
      needsUsername: false,
      needsProfileSetup: false,
      refreshProfile,
      applyOptimisticProfile,
      applyOptimisticSetupComplete,
      markProfileSetupComplete,
      signOut,
      syncSession,
    }),
    [
      user,
      profile,
      ready,
      refreshProfile,
      applyOptimisticProfile,
      applyOptimisticSetupComplete,
      markProfileSetupComplete,
      signOut,
      syncSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
