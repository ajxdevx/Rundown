"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import Popup from "../Popup";

type UpgradeCheckoutProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const FEATURES = [
  "Unlimited projects",
  "Unlimited clients",
  "Custom branding",
  "Invoices",
  "Messaging",
  "Analytics",
];

export function UpgradeCheckout({
  open,
  onClose,
  onSuccess,
}: UpgradeCheckoutProps) {
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setCard("");
    setExpiry("");
    setCvc("");
    setError("");
    setLoading(false);
    setDone(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    setError("");
    if (card.replace(/\s/g, "").length < 12) {
      setError("Enter a valid card number.");
      return;
    }
    if (!expiry.trim() || !cvc.trim()) {
      setError("Complete all payment fields.");
      return;
    }
    if (card.replace(/\s/g, "").endsWith("0000")) {
      setError("Your payment couldn't be processed. Try again.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
    onSuccess();
  };

  return (
    <Popup
      open={open}
      onClose={handleClose}
      label="Upgrade to Pro"
      panelClassName="w-full max-w-lg bg-card"
      showCloseButton
    >
      <div className="max-h-[85vh] overflow-y-auto px-6 pb-6 pt-6">
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent">
              <Check className="size-7 text-ink" strokeWidth={2.25} />
            </div>
            <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold text-ink">
              You&apos;re on Pro 🎉
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your Dueso workspace has been upgraded.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4 text-left">
              <p className="font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
                Pro
              </p>
              <p className="mt-0.5 text-sm text-muted">$9 / month</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl btn-accent px-4 text-sm font-semibold"
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink sm:text-2xl">
              Upgrade to Pro
            </h2>
            <p className="mt-1 text-sm text-muted">
              Dueso Pro · $9 / month
            </p>

            <ul className="mt-5 space-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink">
                  <Check className="size-4 shrink-0 text-ink" strokeWidth={2.25} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold text-ink">Payment</p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Card number"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-ink"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-ink"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="relative mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl btn-accent px-4 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Start Pro — $9 / month"
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Cancel anytime.
            </p>
          </>
        )}
      </div>
    </Popup>
  );
}

type PlanLimitModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  message?: string;
  limitLine?: string;
};

export function PlanLimitModal({
  open,
  onClose,
  onUpgrade,
  title = "You've reached your Free plan limit",
  message = "Upgrade to Pro to unlock this feature.",
  limitLine = "Free includes 1 active project.",
}: PlanLimitModalProps) {
  return (
    <Popup
      open={open}
      onClose={onClose}
      label="Plan limit"
      panelClassName="w-full max-w-md bg-card"
      showCloseButton
    >
      <div className="px-6 pb-6 pt-6">
        <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{limitLine}</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl btn-accent px-5 text-sm font-semibold"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </Popup>
  );
}

type CancelSubscriptionProps = {
  open: boolean;
  onClose: () => void;
  untilDate: string;
  onConfirmCancel: () => void;
};

export function CancelSubscriptionModal({
  open,
  onClose,
  untilDate,
  onConfirmCancel,
}: CancelSubscriptionProps) {
  const [step, setStep] = useState<"warn" | "confirm">("warn");

  const close = () => {
    setStep("warn");
    onClose();
  };

  return (
    <Popup
      open={open}
      onClose={close}
      label="Cancel Pro"
      panelClassName="w-full max-w-md bg-card"
      showCloseButton
    >
      <div className="px-6 pb-6 pt-6">
        {step === "warn" ? (
          <>
            <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
              Cancel Pro?
            </h2>
            <p className="mt-2 text-sm text-muted">
              You&apos;ll keep Pro features until the end of your current billing
              period ({untilDate}).
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl btn-accent px-5 text-sm font-semibold"
              >
                Keep Pro
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
              >
                Continue Cancellation
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
              Are you sure?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your subscription will cancel at the end of the billing period.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStep("warn")}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
              >
                <X className="size-4" />
                Go back
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmCancel();
                  close();
                }}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                Cancel Pro
              </button>
            </div>
          </>
        )}
      </div>
    </Popup>
  );
}
