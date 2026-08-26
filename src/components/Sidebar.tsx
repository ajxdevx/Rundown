"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  Newspaper,
  Swords,
  TrendingUp,
} from "lucide-react";
import SidebarIconButton from "./SidebarIconButton";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Discover" },
  { icon: Swords, label: "Competition" },
  { icon: TrendingUp, label: "Trending" },
  { icon: Newspaper, label: "News", href: "/news" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col items-center overflow-visible border-r border-zinc-700/60 bg-[#0a0a0a]">
      <Link
        href="/"
        className="flex h-20 w-full shrink-0 items-center justify-center"
        aria-label="Rondex home"
      >
        <Image
          src="/logo.png"
          alt="Rondex"
          width={80}
          height={80}
          className="h-20 w-20 max-w-none object-contain"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {navItems.map((item) => {
          const href = "href" in item ? item.href : undefined;
          const active = href
            ? href === "/"
              ? pathname === "/"
              : pathname.startsWith(href)
            : false;

          return (
            <SidebarIconButton
              key={item.label}
              icon={item.icon}
              label={item.label}
              href={href}
              active={active}
              tooltipSide="right"
            />
          );
        })}
      </div>
    </aside>
  );
}
