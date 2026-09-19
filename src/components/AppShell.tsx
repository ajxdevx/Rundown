"use client";

import { AuthProvider } from "./AuthProvider";
import { CommandMenuProvider } from "./CommandMenu";
import MobileNav from "./MobileNav";
import OfflineBanner from "./OfflineBanner";
import Sidebar from "./Sidebar";
import { ToastProvider } from "./ToastProvider";

function AppShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-ink">
      <div className="relative z-40 hidden h-full shrink-0 overflow-visible md:block">
        <Sidebar />
      </div>

      <main className="relative scrollbar-hide min-h-0 min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      <MobileNav />
      <OfflineBanner />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <CommandMenuProvider>
          <AppShellInner>{children}</AppShellInner>
        </CommandMenuProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
