"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import Popup, { PopupCloseButton } from "./Popup";
import { useToastOptional } from "./ToastProvider";

type SharePortalModalProps = {
  open: boolean;
  onClose: () => void;
  portalUrl: string;
  projectName: string;
};

export default function SharePortalModal({
  open,
  onClose,
  portalUrl,
  projectName,
}: SharePortalModalProps) {
  const toast = useToastOptional();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast?.success("Portal link copied");
    } catch {
      toast?.error("Couldn't copy the portal link. Try again.");
    }
  };

  return (
    <Popup
      open={open}
      onClose={onClose}
      labelledBy="share-portal-title"
      panelClassName="w-full max-w-md bg-card"
    >
      <div className="relative px-6 pb-6 pt-6">
        <div className="absolute right-3 top-3">
          <PopupCloseButton onClick={onClose} />
        </div>
        <h2
          id="share-portal-title"
          className="pr-10 text-xl font-semibold tracking-tight text-ink"
        >
          Client Portal
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This is what your client sees for{" "}
          <span className="font-medium text-ink">{projectName}</span>.
        </p>

        <div className="mt-5 rounded-[8px] border border-border bg-surface px-4 py-3">
          <p className="break-all text-sm text-muted">{portalUrl}</p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent text-sm font-semibold"
          >
            <Copy className="size-4" strokeWidth={1.75} />
            Copy Link
          </button>
          <a
            href={portalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-secondary text-sm font-semibold"
          >
            <ExternalLink className="size-4" strokeWidth={1.75} />
            Open Portal
          </a>
        </div>
      </div>
    </Popup>
  );
}
