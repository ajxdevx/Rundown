"use client";

import { Search } from "lucide-react";

type HeaderProps = {
  onSearchOpen: () => void;
};

export default function Header({ onSearchOpen }: HeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center gap-5 border-b border-zinc-700/60 px-6">
      <span className="shrink-0 font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-white">
        Rondex
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
          aria-label="Ask Rondex"
          className="flex h-full shrink-0 cursor-pointer items-center rounded-2xl bg-white px-4 text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90"
        >
          <span className="hidden sm:inline">Ask Rondex</span>
          <span className="sm:hidden">Ask</span>
        </button>
      </div>
    </header>
  );
}
