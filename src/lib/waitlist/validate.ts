import type { WaitlistAudience } from "./types";
import { WAITLIST_AUDIENCES } from "./types";

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return "Enter a valid email address.";
  if (email.length > 254) return "Enter a valid email address.";
  if (/\s/.test(raw.trim())) return "Enter a valid email address.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return null;
}

export function isWaitlistAudience(
  value: string,
): value is WaitlistAudience {
  return (WAITLIST_AUDIENCES as readonly string[]).includes(value);
}
