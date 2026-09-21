"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { landingNavLinks } from "@/data/landingDemo";
import { trackLanding } from "@/lib/landingAnalytics";
import { idFromHash, scrollToId } from "@/lib/landingScroll";
import { JoinWaitlistButton, useWaitlist } from "./waitlist";

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { openWaitlist } = useWaitlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    scrollToId(idFromHash(href));
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? "border-border bg-background/95 shadow-[0_1px_0_rgba(17,17,17,0.04)]"
          : "border-transparent bg-background"
      }`}
    >
      <div className="landing-shell flex h-16 items-center gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Dueso home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 object-contain"
            priority
            unoptimized
          />
          <span className="font-[family-name:var(--font-brand)] text-[16px] font-semibold tracking-tight text-ink">
            Dueso
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Primary"
        >
          {landingNavLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => go(link.href)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-bg-hover hover:text-ink"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            onClick={() => trackLanding("nav_login")}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-bg-hover hover:text-ink"
          >
            Log in
          </Link>
          <JoinWaitlistButton source="navigation" size="sm" />
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-ink hover:bg-bg-hover md:hidden"
          aria-expanded={open}
          aria-controls="marketing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div
          id="marketing-mobile-nav"
          className="border-t border-border bg-background px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {landingNavLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => go(link.href)}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-bg-hover"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/login"
              onClick={() => {
                trackLanding("nav_login");
                setOpen(false);
              }}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted hover:bg-bg-hover hover:text-ink"
            >
              Log in
            </Link>
            <button
              type="button"
              className="btn-accent mt-1 h-10 w-full px-4 text-sm font-medium"
              onClick={() => {
                setOpen(false);
                openWaitlist("navigation");
              }}
            >
              Join Waitlist
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
