"use client";

import {
  Bell,
  Bookmark,
  History,
  Info,
  LayoutGrid,
  Mail,
} from "lucide-react";
import { useState } from "react";
import InfoPanel from "./InfoPanel";
import SidebarIconButton from "./SidebarIconButton";
import Tooltip from "./Tooltip";

const topItems = [
  { icon: Bell, label: "Notifications" },
  { icon: Bookmark, label: "Saved" },
  { icon: History, label: "History" },
  { icon: LayoutGrid, label: "Collections" },
  { icon: Mail, label: "Newsletter" },
] as const;

export default function RightSidebar() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <aside className="relative flex h-full w-20 shrink-0 flex-col items-center overflow-visible border-l border-zinc-700/60 bg-[#0a0a0a]">
      <div className="flex w-full shrink-0 flex-col items-center gap-2 pt-4">
        <button
          type="button"
          aria-label="Account"
          className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-zinc-700/60 bg-zinc-700 text-sm font-semibold text-white"
        >
          U
        </button>

        {topItems.map(({ icon, label }) => (
          <SidebarIconButton
            key={label}
            icon={icon}
            label={label}
            tooltipSide="left"
          />
        ))}
      </div>

      <div className="relative mt-auto flex flex-col items-center pb-6">
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

        <InfoPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </aside>
  );
}
