import type { WaitlistSubmitInput, WaitlistSubmitResult } from "./types";

export async function submitWaitlist(
  input: WaitlistSubmitInput,
): Promise<WaitlistSubmitResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      ok: false,
      status: "offline",
      message: "You're offline. Check your connection and try again.",
    };
  }

  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = (await res.json().catch(() => null)) as
      | {
          status?: string;
          message?: string;
          field?: "email" | "consent";
        }
      | null;

    if (res.status === 201) {
      return { ok: true, status: "created" };
    }

    if (res.status === 200 && data?.status === "duplicate") {
      return { ok: true, status: "duplicate" };
    }

    if (res.status === 400) {
      return {
        ok: false,
        status: "validation",
        message: data?.message ?? "Enter a valid email address.",
        field: data?.field ?? "email",
      };
    }

    if (res.status === 429) {
      return {
        ok: false,
        status: "rate_limited",
        message:
          data?.message ?? "Too many attempts. Please try again shortly.",
      };
    }

    return {
      ok: false,
      status: "error",
      message: data?.message ?? "We couldn't add you right now. Please try again.",
    };
  } catch {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return {
        ok: false,
        status: "offline",
        message: "You're offline. Check your connection and try again.",
      };
    }
    return {
      ok: false,
      status: "error",
      message: "We couldn't add you right now. Please try again.",
    };
  }
}
