import type { AuthError } from "@supabase/supabase-js";

function logDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(message, detail);
  }
}

/** Map Supabase/auth/storage errors to safe, user-facing copy. */
export function mapAuthError(
  error: Pick<AuthError, "message" | "status" | "code"> | Error | string | null | undefined,
): string {
  const raw =
    typeof error === "string"
      ? error
      : error && "message" in error
        ? error.message
        : "Something went wrong.";

  logDev("[auth]", error);

  const message = raw.toLowerCase();
  const status =
    error && typeof error === "object" && "status" in error
      ? Number(error.status)
      : undefined;

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials") ||
    message.includes("wrong password") ||
    message.includes("email not confirmed")
  ) {
    if (message.includes("email not confirmed")) {
      return "Confirm your email, then try logging in again.";
    }
    return "Incorrect email or password.";
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("email address is already")
  ) {
    return "An account with this email already exists. Try logging in.";
  }

  if (
    message.includes("password should be at least") ||
    message.includes("password is too weak") ||
    message.includes("weak password")
  ) {
    return "Password must be at least 6 characters.";
  }

  if (
    message.includes("unable to validate email") ||
    message.includes("invalid email") ||
    (message.includes("email address") && message.includes("invalid"))
  ) {
    return "Enter a valid email address.";
  }

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("over_request_rate")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("offline")
  ) {
    return "Network error. Check your connection and try again.";
  }

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    message.includes("not authenticated") ||
    message.includes("signed in")
  ) {
    return "Your session expired. Please sign in again.";
  }

  if (
    message.includes("duplicate key") ||
    message.includes("unique") ||
    message.includes("23505") ||
    message.includes("already taken")
  ) {
    return "Username already taken";
  }

  if (
    message.includes("storage") ||
    message.includes("bucket") ||
    message.includes("upload") ||
    message.includes("row-level security") ||
    message.includes("unauthorized") ||
    message.includes("accessdenied")
  ) {
    return "Couldn't upload your photo. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

export function mapProfileError(
  error: { message?: string; code?: string } | Error | string | null | undefined,
): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code ?? "")
      : "";

  if (code === "23505") {
    return "Username already taken";
  }

  return mapAuthError(
    typeof error === "string" || error instanceof Error
      ? error
      : error?.message ?? "Something went wrong.",
  );
}
