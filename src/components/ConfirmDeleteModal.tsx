"use client";

import Popup, { PopupCloseButton } from "./Popup";

type ConfirmDeleteModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
};

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
}: ConfirmDeleteModalProps) {
  return (
    <Popup open={open} onClose={onClose} labelledBy="confirm-delete-title">
      <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
        <div className="absolute right-3 top-3">
          <PopupCloseButton onClick={onClose} />
        </div>
        <h2
          id="confirm-delete-title"
          className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-danger px-4 text-sm font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Popup>
  );
}
