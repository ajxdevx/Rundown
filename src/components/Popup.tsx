"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import {
  usePopupEscape,
  usePopupTransition,
} from "@/hooks/usePopupTransition";

type PopupCloseButtonProps = {
  onClick: () => void;
  className?: string;
};

export function PopupCloseButton({
  onClick,
  className = "",
}: PopupCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-xl text-zinc-500 hover-soft ${className}`}
    >
      <X className="size-4" strokeWidth={1.75} />
    </button>
  );
}

type PopupProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  align?: "center" | "top";
  labelledBy?: string;
  label?: string;
  showCloseButton?: boolean;
  closeButtonClassName?: string;
};

export default function Popup({
  open,
  onClose,
  children,
  panelClassName = "",
  align = "center",
  labelledBy,
  label,
  showCloseButton = false,
  closeButtonClassName = "",
}: PopupProps) {
  const { visible, closing } = usePopupTransition(open);
  usePopupEscape(open && !closing, onClose);

  if (!visible) return null;

  const alignClass =
    align === "top"
      ? "items-start justify-center px-4 pt-[10vh]"
      : "items-center justify-center px-4 py-6";

  return (
    <div className={`fixed inset-0 z-[100] flex ${alignClass}`}>
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/65 ${
          closing ? "animate-popup-backdrop-out" : "animate-popup-backdrop"
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        className={`relative z-10 overflow-hidden rounded-3xl border border-zinc-700/50 ${
          closing ? "animate-popup-panel-out" : "animate-popup-panel"
        } ${panelClassName}`}
      >
        {showCloseButton && (
          <div className={`absolute top-4 right-4 z-20 ${closeButtonClassName}`}>
            <PopupCloseButton onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
