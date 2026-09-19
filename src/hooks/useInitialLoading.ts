"use client";

import { useEffect, useState } from "react";

/**
 * Brief first-paint loading gate for mock/local data so skeletons
 * match real network retrieval. Set duration to 0 once data is server-fetched.
 */
export function useInitialLoading(durationMs = 480) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (durationMs <= 0) {
      setLoading(false);
      return;
    }
    const id = window.setTimeout(() => setLoading(false), durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs]);

  return loading;
}
