"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [flashOnline, setFlashOnline] = useState(false);

  useEffect(() => {
    const update = () => {
      const next = navigator.onLine;
      setOnline((prev) => {
        if (!prev && next) {
          setFlashOnline(true);
          window.setTimeout(() => setFlashOnline(false), 2200);
        }
        return next;
      });
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online && !flashOnline) return null;

  return (
    <div
      role="status"
      className={`fixed left-1/2 top-3 z-[190] w-[min(100vw-1.5rem,24rem)] -translate-x-1/2 rounded-2xl border px-4 py-2.5 text-center shadow-[0_8px_30px_rgba(0,0,0,0.1)] ${
        online
          ? "border-border bg-card text-ink"
          : "border-amber-200 bg-card text-ink"
      }`}
    >
      {online ? (
        <p className="text-sm font-semibold">Back online</p>
      ) : (
        <>
          <p className="text-sm font-semibold">You&apos;re offline</p>
          <p className="mt-0.5 text-xs text-muted">
            Changes will sync when you&apos;re back online.
          </p>
        </>
      )}
    </div>
  );
}
