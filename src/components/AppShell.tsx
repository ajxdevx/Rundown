"use client";

import { Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import CategoryBar from "./CategoryBar";
import Header from "./Header";
import RightSidebar from "./RightSidebar";
import SearchModal from "./SearchModal";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div
        className={`relative z-40 h-full shrink-0 transition-[width] duration-500 ease-out ${
          isFullscreen ? "w-0 overflow-hidden" : "w-20 overflow-visible"
        }`}
      >
        <div className="h-full w-20 overflow-visible">
          <Sidebar />
        </div>
      </div>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={`shrink-0 overflow-hidden transition-[height] duration-500 ease-out ${
            isFullscreen ? "h-0" : "h-20"
          }`}
        >
          <div className="h-20">
            <Header
              onSearchOpen={() => setSearchOpen(true)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            />
          </div>
        </div>

        <CategoryBar />

        <main className="relative scrollbar-hide min-h-0 flex-1 overflow-y-auto">
          {children}

          <button
            type="button"
            aria-label="Exit fullscreen"
            onClick={() => setIsFullscreen(false)}
            className={`fixed top-5 right-5 z-50 flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-zinc-700/60 bg-[#141414] text-zinc-400 transition-opacity duration-300 hover:bg-zinc-800 hover:text-white ${
              isFullscreen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <Minimize2 className="size-5" strokeWidth={1.75} />
          </button>
        </main>
      </div>

      <div
        className={`relative z-40 h-full shrink-0 transition-[width] duration-500 ease-out ${
          isFullscreen ? "w-0 overflow-hidden" : "w-20 overflow-visible"
        }`}
      >
        <div className="h-full w-20 overflow-visible">
          <RightSidebar />
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
