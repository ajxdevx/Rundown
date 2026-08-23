"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./AuthProvider";
import CategoryBar from "./CategoryBar";
import Header from "./Header";
import RightSidebar from "./RightSidebar";
import SearchModal from "./SearchModal";
import Sidebar from "./Sidebar";
import SignUpModal from "./SignUpModal";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading, needsUsername } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const showRightSidebar = !loading && !!user;

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
    if (needsUsername) setSignUpOpen(true);
  }, [needsUsername]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="relative z-40 h-full w-20 shrink-0 overflow-visible">
        <Sidebar />
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onSearchOpen={() => setSearchOpen(true)}
          onSignUpOpen={() => setSignUpOpen(true)}
        />

        <CategoryBar />

        <main className="relative scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {showRightSidebar && (
        <div className="relative z-40 h-full w-20 shrink-0 overflow-visible">
          <RightSidebar />
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SignUpModal open={signUpOpen} onClose={() => setSignUpOpen(false)} />
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
