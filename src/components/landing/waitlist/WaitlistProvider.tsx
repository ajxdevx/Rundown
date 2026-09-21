"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Popup from "@/components/Popup";
import type { WaitlistSource } from "@/lib/waitlist/types";
import { captureUtmToSession } from "@/lib/waitlist/utm";
import { trackLanding } from "@/lib/landingAnalytics";
import { WaitlistForm } from "./WaitlistForm";

type WaitlistContextValue = {
  openWaitlist: (source: WaitlistSource) => void;
  closeWaitlist: () => void;
  isOpen: boolean;
};

const WaitlistContext = createContext<WaitlistContextValue | null>(null);

export function useWaitlist() {
  const ctx = useContext(WaitlistContext);
  if (!ctx) {
    throw new Error("useWaitlist must be used within WaitlistProvider");
  }
  return ctx;
}

export function useWaitlistOptional() {
  return useContext(WaitlistContext);
}

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<WaitlistSource>("navigation");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    captureUtmToSession();
  }, []);

  const openWaitlist = useCallback((nextSource: WaitlistSource) => {
    setSource(nextSource);
    setConfirmLeave(false);
    setDirty(false);
    setFormKey((k) => k + 1);
    setOpen(true);
    trackLanding("waitlist_cta_clicked", { source: nextSource });
    trackLanding("waitlist_form_opened", { source: nextSource });
    trackLanding("waitlist_source", { source: nextSource });
    if (nextSource === "navigation") trackLanding("nav_waitlist");
    if (nextSource === "hero") trackLanding("hero_cta_waitlist");
  }, []);

  const forceClose = useCallback(() => {
    setOpen(false);
    setConfirmLeave(false);
    setDirty(false);
  }, []);

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmLeave(true);
      return;
    }
    forceClose();
  }, [dirty, forceClose]);

  const value = useMemo(
    () => ({
      openWaitlist,
      closeWaitlist: requestClose,
      isOpen: open,
    }),
    [openWaitlist, requestClose, open],
  );

  return (
    <WaitlistContext.Provider value={value}>
      {children}

      <Popup
        open={open}
        onClose={requestClose}
        labelledBy="waitlist-modal-title"
        panelClassName="w-full max-w-md bg-card"
        showCloseButton={!confirmLeave}
      >
        {confirmLeave ? (
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              Leave the waitlist form?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your information hasn&apos;t been submitted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn-accent h-10 px-4 text-sm font-medium"
                onClick={() => setConfirmLeave(false)}
              >
                Continue
              </button>
              <button
                type="button"
                className="btn-secondary h-10 px-4 text-sm font-medium"
                onClick={forceClose}
              >
                Leave
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="pr-8">
              <h2
                id="waitlist-modal-title"
                className="text-lg font-semibold tracking-tight text-ink"
              >
                Join Dueso early access
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Be among the first to try Dueso and help shape the product.
              </p>
            </div>

            <DirtyAwareForm
              key={formKey}
              source={source}
              onDirtyChange={setDirty}
              onSuccess={() => setDirty(false)}
            />

            <button
              type="button"
              onClick={requestClose}
              className="mt-4 w-full text-center text-sm font-medium text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
        )}
      </Popup>
    </WaitlistContext.Provider>
  );
}

function DirtyAwareForm({
  source,
  onDirtyChange,
  onSuccess,
}: {
  source: WaitlistSource;
  onDirtyChange: (dirty: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <div
      className="mt-6"
      onInput={() => onDirtyChange(true)}
      onChange={() => onDirtyChange(true)}
    >
      <WaitlistForm
        source={source}
        variant="modal"
        idPrefix={`modal-${source}`}
        onSuccess={onSuccess}
      />
    </div>
  );
}
