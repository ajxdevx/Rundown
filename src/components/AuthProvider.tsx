"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

export type Profile = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
  role: string | null;
};

/** Resolved auth status after the initial Supabase session check. */
export type AuthStatus = "loading" | "authenticated" | "loggedOut";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  /**
   * True until the initial getSession() finishes and, when a session exists,
   * until that user's profile has been fetched. While true, do not show
   * auth-dependent UI or onboarding popups.
   */
  authLoading: boolean;
  /** Alias of authLoading for existing callers. */
  loading: boolean;
  status: AuthStatus;
  /**
   * True when authenticated and either username is missing or profile setup
   * has not been completed/skipped yet.
   */
  needsOnboarding: boolean;
  /** @deprecated Prefer needsOnboarding — true when username is missing. */
  needsUsername: boolean;
  /**
   * @deprecated Prefer needsOnboarding — true when username exists but setup incomplete.
   */
  needsProfileSetup: boolean;
  refreshProfile: () => Promise<Profile | null>;
  /** Instant local profile update for optimistic UI (backend remains authoritative). */
  applyOptimisticProfile: (next: Profile) => void;
  /** Instant local flag so onboarding closes before metadata write finishes. */
  applyOptimisticSetupComplete: (complete: boolean) => void;
  markProfileSetupComplete: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isProfileSetupCompleted(user: User | null | undefined) {
  return user?.user_metadata?.profile_setup_completed === true;
}

function withSetupComplete(user: User, complete: boolean): User {
  return {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      profile_setup_completed: complete,
    },
  };
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url, bio, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to load profile:", error.message);
    }
    return null;
  }

  if (!data) return null;

  return {
    username: data.username ?? null,
    avatar_url: data.avatar_url ?? null,
    bio: data.bio ?? null,
    display_name: data.display_name ?? null,
    role: data.role ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const syncIdRef = useRef(0);
  const mountedRef = useRef(true);
  const activeUserIdRef = useRef<string | null>(null);
  /** After first profile resolve for a session, background refreshes must not flicker loading. */
  const profileReadyRef = useRef(false);
  /**
   * Until the first getSession() completes, a null session from onAuthStateChange
   * must NOT be treated as loggedOut (avoids refresh flicker).
   */
  const initialSessionResolvedRef = useRef(false);

  const clearAuthState = useCallback(() => {
    activeUserIdRef.current = null;
    profileReadyRef.current = false;
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
    setAuthLoading(false);
  }, []);

  const applySession = useCallback(
    async (
      session: Session | null,
      options: { source: "getSession" | "authChange" },
    ) => {
      const syncId = ++syncIdRef.current;
      const currentUser = session?.user ?? null;

      if (!currentUser) {
        if (!mountedRef.current || syncId !== syncIdRef.current) return;

        // Ignore premature null sessions until the initial getSession() finishes.
        if (
          options.source === "authChange" &&
          !initialSessionResolvedRef.current
        ) {
          return;
        }

        initialSessionResolvedRef.current = true;
        clearAuthState();
        return;
      }

      if (!mountedRef.current || syncId !== syncIdRef.current) return;

      // Session presence is known — later null events (e.g. SIGNED_OUT) must apply.
      initialSessionResolvedRef.current = true;

      const sameUser = activeUserIdRef.current === currentUser.id;
      const quietRefresh = sameUser && profileReadyRef.current;

      activeUserIdRef.current = currentUser.id;
      setUser(currentUser);

      // Only block UI on first profile load / user switch — not on token refresh.
      if (!quietRefresh) {
        setProfileLoading(true);
      }

      const next = await fetchProfile(currentUser.id);

      // A newer session event (or logout) superseded this fetch.
      if (!mountedRef.current || syncId !== syncIdRef.current) return;
      if (activeUserIdRef.current !== currentUser.id) return;

      setProfile(next);
      profileReadyRef.current = true;
      setProfileLoading(false);
      setAuthLoading(false);
    },
    [clearAuthState],
  );

  const refreshProfile = useCallback(async () => {
    const syncId = syncIdRef.current;
    const expectedUserId = activeUserIdRef.current;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (!currentUser) {
      if (syncId === syncIdRef.current) {
        setProfile(null);
      }
      return null;
    }

    if (
      syncId !== syncIdRef.current ||
      (expectedUserId && expectedUserId !== currentUser.id)
    ) {
      return null;
    }

    setUser(currentUser);
    const next = await fetchProfile(currentUser.id);

    if (
      syncId !== syncIdRef.current ||
      activeUserIdRef.current !== currentUser.id
    ) {
      return null;
    }

    setProfile(next);
    return next;
  }, []);

  const applyOptimisticProfile = useCallback((next: Profile) => {
    if (!activeUserIdRef.current) return;
    setProfile(next);
  }, []);

  const applyOptimisticSetupComplete = useCallback((complete: boolean) => {
    setUser((prev) => (prev ? withSetupComplete(prev, complete) : prev));
  }, []);

  const markProfileSetupComplete = useCallback(async () => {
    const syncId = syncIdRef.current;
    const expectedUserId = activeUserIdRef.current;

    const { data, error } = await supabase.auth.updateUser({
      data: { profile_setup_completed: true },
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to mark profile setup complete:", error.message);
      }
      throw error;
    }

    if (
      syncId !== syncIdRef.current ||
      !data.user ||
      (expectedUserId && data.user.id !== expectedUserId)
    ) {
      return;
    }

    setUser(data.user);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initialSessionResolvedRef.current = false;

    // Initial session — gate all auth UI until this (+ profile) settles.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session, { source: "getSession" });
    });

    // Keep state in sync for sign-in, sign-out, token refresh, and metadata updates.
    // Skip INITIAL_SESSION — getSession() owns the first resolution (avoids flicker/races).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // getSession() owns the first resolution — skip the duplicate INITIAL_SESSION.
      if (event === "INITIAL_SESSION") return;
      // Always honor explicit sign-out, even if it races the first getSession().
      if (event === "SIGNED_OUT") {
        initialSessionResolvedRef.current = true;
      }
      void applySession(session, { source: "authChange" });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    // Invalidate in-flight profile fetches before clearing local state.
    syncIdRef.current += 1;
    initialSessionResolvedRef.current = true;
    clearAuthState();
    await supabase.auth.signOut();
  }, [clearAuthState]);

  const status: AuthStatus = authLoading
    ? "loading"
    : user
      ? "authenticated"
      : "loggedOut";

  const needsUsername =
    status === "authenticated" &&
    !profileLoading &&
    !profile?.username;

  const needsProfileSetup =
    status === "authenticated" &&
    !profileLoading &&
    !!profile?.username &&
    !isProfileSetupCompleted(user);

  const needsOnboarding =
    status === "authenticated" &&
    !profileLoading &&
    (!profile?.username || !isProfileSetupCompleted(user));

  const value = useMemo(
    () => ({
      user,
      profile,
      authLoading,
      loading: authLoading,
      status,
      needsOnboarding,
      needsUsername,
      needsProfileSetup,
      refreshProfile,
      applyOptimisticProfile,
      applyOptimisticSetupComplete,
      markProfileSetupComplete,
      signOut,
    }),
    [
      user,
      profile,
      authLoading,
      status,
      needsOnboarding,
      needsUsername,
      needsProfileSetup,
      refreshProfile,
      applyOptimisticProfile,
      applyOptimisticSetupComplete,
      markProfileSetupComplete,
      signOut,
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
