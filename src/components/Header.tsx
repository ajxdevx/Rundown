"use client";

import { Info, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import InfoPanel from "./InfoPanel";
import Tooltip from "./Tooltip";

type HeaderProps = {
  onSearchOpen: () => void;
  onSignUpOpen: () => void;
};

export default function Header({ onSearchOpen, onSignUpOpen }: HeaderProps) {
  const { user, profile, loading, signOut } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const displayName =
    profile?.username ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    "Account";

  return (
    <header className="flex h-20 shrink-0 items-center gap-5 border-b border-zinc-700/60 px-6">
      <span className="shrink-0 font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-white">
        Rundown
      </span>

      <div className="mx-auto flex h-11 w-full max-w-2xl flex-1 items-stretch gap-2.5">
        <button
          type="button"
          aria-label="Search"
          onClick={onSearchOpen}
          className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl bg-[#222222] px-4 text-left"
        >
          <Search
            className="size-4 shrink-0 text-zinc-500"
            strokeWidth={1.75}
          />
          <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-brand)] text-sm text-zinc-500">
            Search tools, discover, trending...
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex">
            <kbd className="rounded-md bg-[#1c1c1c] px-2 py-1 font-sans text-xs font-medium text-zinc-400">
              Ctrl
            </kbd>
            <kbd className="rounded-md bg-[#1c1c1c] px-2 py-1 font-sans text-xs font-medium text-zinc-400">
              K
            </kbd>
          </span>
        </button>

        <button
          type="button"
          aria-label="Ask Rundown"
          className="flex h-full shrink-0 cursor-pointer items-center rounded-2xl bg-white px-4 text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90"
        >
          <span className="hidden sm:inline">Ask Rundown</span>
          <span className="sm:hidden">Ask</span>
        </button>
      </div>

      <div className="relative flex shrink-0 items-center gap-2.5">
        <button
          id="info-panel-trigger"
          type="button"
          aria-label="Help"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((v) => !v)}
          className={`group relative flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-colors duration-200 ${
            helpOpen
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <Info className="size-6 shrink-0" strokeWidth={1.75} />
          <Tooltip label="Help" side="left" />
        </button>

        {!loading && user ? (
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void signOut()}
            className="flex h-12 max-w-[220px] shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90"
          >
            <span className="truncate">{displayName}</span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Sign up"
            onClick={onSignUpOpen}
            className="flex h-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90"
          >
            Sign up
          </button>
        )}

        <InfoPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </header>
  );
}
