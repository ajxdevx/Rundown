"use client";

import {
  BookOpen,
  CircleHelp,
  FileText,
  FolderKanban,
  Keyboard,
  Mail,
  Plus,
  Search,
  Sparkles,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCommandMenuOptional } from "./CommandMenu";

type DashboardTopBarProps = {
  /** Soft section context — not a page title. Prefer breadcrumbs for nested routes. */
  context?: string;
  breadcrumb?: { label: string; href?: string }[];
  onSignUpOpen?: () => void;
};

function SearchShortcutKeys() {
  const [mod, setMod] = useState("Ctrl");

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
    setMod(isMac ? "⌘" : "Ctrl");
  }, []);

  return (
    <>
      <kbd className="rounded-[5px] border border-border bg-surface px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted">
        {mod}
      </kbd>
      <kbd className="rounded-[5px] border border-border bg-surface px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted">
        K
      </kbd>
    </>
  );
}

function MenuPanel({
  open,
  onClose,
  children,
  widthClass = "w-52",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className={`absolute right-0 top-full z-40 mt-1.5 overflow-hidden rounded-[12px] border border-border bg-card p-1.5 shadow-[var(--shadow-popover)] ${widthClass}`}
    >
      {children}
    </div>
  );
}

function MenuItem({
  href,
  onClick,
  icon: Icon,
  children,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof FolderKanban;
  children: ReactNode;
}) {
  const className =
    "flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium text-ink outline-none hover-soft focus-visible:ring-2 focus-visible:ring-ink/20";
  const iconEl = (
    <Icon className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
  );

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto:");
    if (external) {
      return (
        <a
          href={href}
          role="menuitem"
          onClick={onClick}
          className={className}
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {iconEl}
          {children}
        </a>
      );
    }
    return (
      <Link href={href} role="menuitem" onClick={onClick} className={className}>
        {iconEl}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`cursor-pointer ${className}`}
    >
      {iconEl}
      {children}
    </button>
  );
}

export default function DashboardTopBar({
  context,
  breadcrumb,
}: DashboardTopBarProps) {
  const command = useCommandMenuOptional();
  const [createOpen, setCreateOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const closeOthers = () => {
    setCreateOpen(false);
    setHelpOpen(false);
  };

  const nested = breadcrumb && breadcrumb.length > 1 ? breadcrumb : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6 md:h-16 md:px-8">
      {/* Left — breadcrumb / section context */}
      <div className="hidden min-w-0 shrink-0 sm:block sm:max-w-[220px] lg:max-w-[320px]">
        {nested ? (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-sm"
          >
            {nested.map((crumb, i) => (
              <span
                key={`${crumb.label}-${i}`}
                className="flex min-w-0 items-center gap-1.5"
              >
                {i > 0 ? (
                  <span className="text-muted-soft" aria-hidden>
                    /
                  </span>
                ) : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate font-medium text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate font-medium text-ink">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : context ? (
          <p className="truncate text-sm font-medium text-muted">{context}</p>
        ) : null}
      </div>

      {/* Center — Global search */}
      <div className="mx-auto flex h-10 min-w-0 max-w-xl flex-1 items-stretch">
        <button
          type="button"
          aria-label="Search projects, clients, files, invoices, messages"
          onClick={() => {
            closeOthers();
            command?.setOpen(true);
          }}
          className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 text-left outline-none transition-colors hover:border-border-strong hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <Search className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-soft">
            Search projects, clients, files...
          </span>
          <span className="hidden shrink-0 items-center gap-0.5 sm:inline-flex">
            <SearchShortcutKeys />
          </span>
        </button>
      </div>

      {/* Right — Quick create + Help */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            type="button"
            aria-label="Open quick create"
            aria-expanded={createOpen}
            onClick={() => {
              setHelpOpen(false);
              setCreateOpen((v) => !v);
            }}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ink/20 sm:px-3 ${
              createOpen
                ? "bg-surface text-ink"
                : "text-muted hover-bg-muted"
            }`}
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-accent text-ink"
            >
              <Plus className="size-4" strokeWidth={2.25} />
            </span>
            <span className="hidden text-sm font-medium sm:inline">
              Open quick create
            </span>
          </button>
          <MenuPanel open={createOpen} onClose={() => setCreateOpen(false)}>
            <MenuItem
              href="/projects/new"
              icon={FolderKanban}
              onClick={() => setCreateOpen(false)}
            >
              New Project
            </MenuItem>
            <MenuItem
              href="/clients/new"
              icon={UserPlus}
              onClick={() => setCreateOpen(false)}
            >
              Add Client
            </MenuItem>
            <MenuItem
              href="/projects/acme-website-redesign?tab=invoices"
              icon={FileText}
              onClick={() => setCreateOpen(false)}
            >
              Create Invoice
            </MenuItem>
          </MenuPanel>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Help and support"
            aria-expanded={helpOpen}
            onClick={() => {
              setCreateOpen(false);
              setHelpOpen((v) => !v);
            }}
            className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ink/20 sm:px-3 ${
              helpOpen
                ? "bg-surface text-ink"
                : "text-muted hover-bg-muted"
            }`}
          >
            <CircleHelp className="size-[18px] shrink-0" strokeWidth={1.75} />
            <span className="hidden text-sm font-medium sm:inline">Help</span>
          </button>
          <MenuPanel
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            widthClass="w-56"
          >
            <MenuItem
              href="https://help.dueso.app"
              icon={BookOpen}
              onClick={() => setHelpOpen(false)}
            >
              Help Center
            </MenuItem>
            <MenuItem
              href="mailto:support@dueso.app"
              icon={Mail}
              onClick={() => setHelpOpen(false)}
            >
              Contact Support
            </MenuItem>
            <MenuItem
              icon={Keyboard}
              onClick={() => {
                setHelpOpen(false);
                command?.setOpen(true);
              }}
            >
              Keyboard Shortcuts
            </MenuItem>
            <MenuItem
              href="/activity"
              icon={Sparkles}
              onClick={() => setHelpOpen(false)}
            >
              What&apos;s New
            </MenuItem>
          </MenuPanel>
        </div>
      </div>
    </header>
  );
}
