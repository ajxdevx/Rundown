"use client";

import {
  Bell,
  Bookmark,
  History,
  LayoutGrid,
  Mail,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import SidebarIconButton from "./SidebarIconButton";

const topItems = [
  { icon: Bell, label: "Notifications" },
  { icon: Bookmark, label: "Saved" },
  { icon: History, label: "History" },
  { icon: LayoutGrid, label: "Collections" },
  { icon: Mail, label: "Newsletter" },
] as const;

export default function RightSidebar() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="relative flex h-full w-20 shrink-0 flex-col items-center overflow-visible border-l border-zinc-700/60 bg-[#0a0a0a]">
      <div className="flex w-full shrink-0 flex-col items-center gap-2 pt-4">
        {topItems.map(({ icon, label }) => (
          <SidebarIconButton
            key={label}
            icon={icon}
            label={label}
            tooltipSide="left"
          />
        ))}
      </div>
    </aside>
  );
}
