"use client";

import Image from "next/image";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa6";

type InfoPanelProps = {
  open: boolean;
  onClose: () => void;
};

const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: FaInstagram },
  { label: "TikTok", href: "https://tiktok.com", icon: FaTiktok },
  { label: "LinkedIn", href: "https://linkedin.com", icon: FaLinkedinIn },
  { label: "Twitter", href: "https://twitter.com", icon: FaTwitter },
  { label: "YouTube", href: "https://youtube.com", icon: FaYoutube },
] as const;

const primaryLinks = ["About", "Contact", "Advertise"] as const;
const legalLinks = ["Guidelines", "Privacy", "Terms"] as const;

const PANEL_WIDTH = 360;
const GAP = 14;
const VIEWPORT_PAD = 16;

export default function InfoPanel({ open, onClose }: InfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const place = () => {
      const trigger = document.getElementById("info-panel-trigger");
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const rect = trigger.getBoundingClientRect();
      const maxHeight = Math.max(180, window.innerHeight - VIEWPORT_PAD * 2);
      const panelHeight = Math.min(panel.offsetHeight || 480, maxHeight);

      let left = rect.left - PANEL_WIDTH - GAP;
      left = Math.min(
        Math.max(left, VIEWPORT_PAD),
        window.innerWidth - PANEL_WIDTH - VIEWPORT_PAD,
      );

      let top = rect.bottom - panelHeight;
      top = Math.min(
        Math.max(top, VIEWPORT_PAD),
        window.innerHeight - panelHeight - VIEWPORT_PAD,
      );

      setPos({ top, left, maxHeight });
    };

    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      const trigger = document.getElementById("info-panel-trigger");
      if (trigger?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="About Rundown"
      style={
        pos
          ? { top: pos.top, left: pos.left, maxHeight: pos.maxHeight }
          : { top: 0, left: 0, visibility: "hidden" }
      }
      className="animate-info-panel fixed z-[100] flex w-[360px] flex-col overflow-hidden rounded-[28px] border border-zinc-700/50 bg-[#222222]"
    >
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/35 text-zinc-400 transition-colors duration-200 hover:bg-zinc-800 hover:text-white"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>

        <div className="flex flex-col items-center px-7 pt-10 pb-8 text-center">
          <Image
            src="/logo.png"
            alt=""
            width={88}
            height={88}
            className="size-[88px] object-contain"
            unoptimized
          />
          <h2 className="mt-4 font-[family-name:var(--font-brand)] text-3xl font-bold tracking-tight text-white">
            Rundown
          </h2>
          <p className="mt-3 max-w-[260px] text-[15px] leading-relaxed text-zinc-400">
            The best AI tools for builders & creators, curated in one place.
          </p>
        </div>

        <div className="mx-5 mb-5 overflow-hidden rounded-2xl bg-[#1a1a1a]">
          {socials.map(({ label, href, icon: Icon }, i) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-200 hover:bg-zinc-800/80 ${
                i < socials.length - 1 ? "border-b border-zinc-800" : ""
              }`}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-[#222222] text-zinc-300">
                <Icon className="size-4" />
              </span>
              <span className="flex-1 text-left text-[15px] font-medium text-zinc-200 transition-colors duration-200 group-hover:text-white">
                {label}
              </span>
              <ArrowUpRight
                className="size-4 text-zinc-600 transition-colors duration-200 group-hover:text-zinc-300"
                strokeWidth={1.75}
              />
            </a>
          ))}
        </div>

        <div className="mx-5 mb-6 grid grid-cols-3 gap-2">
          {primaryLinks.map((label) => (
            <button
              key={label}
              type="button"
              className="cursor-pointer rounded-xl bg-[#1a1a1a] px-2 py-3 text-center text-sm font-medium text-zinc-300 transition-colors duration-200 hover:bg-zinc-800 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-center gap-4 px-5">
          {legalLinks.map((label) => (
            <button
              key={label}
              type="button"
              className="cursor-pointer text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-14 shrink-0 items-center justify-center bg-[#1a1a1a]">
        <p className="m-0 text-center text-sm leading-none text-zinc-500">
          © {new Date().getFullYear()} Rundown. All rights reserved.
        </p>
      </div>
    </div>,
    document.body,
  );
}
