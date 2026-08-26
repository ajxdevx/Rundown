"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "./AuthProvider";
import { MainContentSkeleton } from "./AppSkeleton";
import CategoryBar from "./CategoryBar";
import Header from "./Header";
import ProfileSetupModal from "./ProfileSetupModal";
import RightSidebar from "./RightSidebar";
import SearchModal from "./SearchModal";
import Sidebar from "./Sidebar";
import SignUpModal from "./SignUpModal";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isToolPage = pathname.startsWith("/tools/");
  const { user, authLoading, needsOnboarding, status } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [profileSetupOpen, setProfileSetupOpen] = useState(false);
  const [holdMainSkeleton, setHoldMainSkeleton] = useState(true);
  const loadStartedAtRef = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );

  useEffect(() => {
    if (authLoading) {
      setHoldMainSkeleton(true);
      return;
    }

    const elapsed =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      loadStartedAtRef.current;
    const remaining = Math.max(0, 400 - elapsed);
    const timer = window.setTimeout(() => setHoldMainSkeleton(false), remaining);
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  const showMainSkeleton = !isToolPage && (authLoading || holdMainSkeleton);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onOpenSignup = () => setSignUpOpen(true);
    window.addEventListener("rundown:open-signup", onOpenSignup);
    return () =>
      window.removeEventListener("rundown:open-signup", onOpenSignup);
  }, []);

  useEffect(() => {
    if (authLoading || status === "loading") {
      return;
    }

    if (status === "loggedOut" || !user) {
      setProfileSetupOpen(false);
      setSignUpOpen(false);
      return;
    }

    if (needsOnboarding) {
      setSignUpOpen(false);
      setProfileSetupOpen(true);
      return;
    }

    setProfileSetupOpen(false);
  }, [authLoading, status, user, needsOnboarding]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="relative z-40 h-full w-20 shrink-0 overflow-visible">
        <Sidebar />
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onSearchOpen={() => setSearchOpen(true)} />
        {!isToolPage ? <CategoryBar /> : null}

        <main className="relative scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto">
          {showMainSkeleton ? <MainContentSkeleton /> : children}
        </main>
      </div>

      <div className="relative z-40 h-full w-20 shrink-0 overflow-visible">
        <RightSidebar onSignUpOpen={() => setSignUpOpen(true)} />
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} />
      <ProfileSetupModal
        open={profileSetupOpen}
        onClose={() => setProfileSetupOpen(false)}
      />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}
