"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { hoverPrimary, hoverSoftMuted } from "@/lib/hover";
import Tooltip from "./Tooltip";

type SidebarIconButtonProps = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  tooltipSide?: "left" | "right";
  variant?: "default" | "create";
  href?: string;
  onClick?: () => void;
};

export default function SidebarIconButton({
  label,
  icon: Icon,
  active = false,
  tooltipSide = "right",
  variant = "default",
  href,
  onClick,
}: SidebarIconButtonProps) {
  const isCreate = variant === "create";

  const className = `group relative flex size-12 cursor-pointer items-center justify-center rounded-2xl ${
    isCreate
      ? `btn-accent ${hoverPrimary}`
      : active
        ? "bg-ink text-card"
        : hoverSoftMuted
  }`;

  const content = (
    <>
      <Icon className="size-6 shrink-0" strokeWidth={isCreate ? 2.25 : 1.75} />
      <Tooltip label={label} side={tooltipSide} />
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  );
}
