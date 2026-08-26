"use client";

import {
  Check,
  ImageIcon,
  Link2,
  Mail,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Popup from "@/components/Popup";
import type { Tool } from "@/data/tools";

type ShareToolModalProps = {
  open: boolean;
  onClose: () => void;
  tool: Tool;
  onToast?: (message: string) => void;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.4V9.84c0-2.37 1.41-3.68 3.56-3.68 1.03 0 2.11.18 2.11.18v2.33h-1.19c-1.17 0-1.54.73-1.54 1.48v1.78h2.62l-.42 2.91h-2.2V22c4.78-.75 8.44-4.91 8.44-9.93z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

export default function ShareToolModal({
  open,
  onClose,
  tool,
  onToast,
}: ShareToolModalProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/tools/${tool.slug}`;
    return `${window.location.origin}/tools/${tool.slug}`;
  }, [tool.slug]);

  const shareDescription =
    tool.description?.trim() ||
    tool.fullDescription?.trim() ||
    `${tool.name} on Rondex`;
  const shareTitle = `${tool.name} - ${shareDescription}`;
  const shareText = shareTitle;

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onToast?.("Link copied");
    } catch {
      onToast?.("Could not copy link");
    } finally {
      setBusy(null);
    }
  };

  const openWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
  };

  const shareFacebook = () => {
    openWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    );
  };

  const shareX = () => {
    openWindow(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    );
  };

  const shareEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
  };

  const shareLinkedIn = () => {
    openWindow(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    );
  };

  const actions = [
    {
      id: "copy",
      label: copied ? "Copied" : "Copy",
      onClick: () => void copyLink(),
      icon: copied ? (
        <Check className="size-5 text-emerald-400" strokeWidth={2} />
      ) : (
        <Link2 className="size-5" strokeWidth={1.75} />
      ),
    },
    {
      id: "facebook",
      label: "Facebook",
      onClick: shareFacebook,
      icon: <FacebookIcon className="size-5" />,
    },
    {
      id: "x",
      label: "X",
      onClick: shareX,
      icon: <XIcon className="size-5" />,
    },
    {
      id: "email",
      label: "Email",
      onClick: shareEmail,
      icon: <Mail className="size-5" strokeWidth={1.75} />,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      onClick: shareLinkedIn,
      icon: <LinkedInIcon className="size-5" />,
    },
  ] as const;

  return (
    <Popup
      open={open}
      onClose={onClose}
      label="Share this tool"
      showCloseButton
      panelClassName="w-full max-w-md bg-[#1a1a1a] p-5 sm:p-6"
    >
      <div className="pr-10">
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Share this tool
        </h2>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-700/60 bg-[#141414]">
        <div
          className="flex aspect-[16/10] w-full items-center justify-center"
          style={{ backgroundColor: tool.color }}
          aria-label="Share preview image placeholder"
        >
          <div className="flex flex-col items-center gap-2 text-white/70">
            {tool.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tool.logoUrl}
                alt=""
                className="size-14 object-contain opacity-90"
              />
            ) : (
              <ImageIcon className="size-10" strokeWidth={1.5} />
            )}
            <span className="text-sm font-medium">{tool.name}</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-zinc-500">Rondex</p>
          <p className="mt-1 line-clamp-3 text-sm font-semibold text-white sm:text-[15px]">
            {shareTitle}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex flex-col items-center gap-2"
          >
            <button
              type="button"
              onClick={action.onClick}
              disabled={busy === action.id}
              aria-label={action.label}
              className="flex size-12 cursor-pointer items-center justify-center rounded-xl bg-[#111111] text-white hover-soft disabled:opacity-60 sm:size-14"
            >
              {action.icon}
            </button>
            <span
              className={`text-[11px] font-medium sm:text-xs ${
                action.id === "copy" && copied
                  ? "text-emerald-400"
                  : "text-zinc-400"
              }`}
            >
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </Popup>
  );
}
