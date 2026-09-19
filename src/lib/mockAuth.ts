/** Mock auth for UI — replace with real auth later. */

export type WorkspaceRole =
  | "Freelancer"
  | "Agency"
  | "Studio"
  | "Consultant"
  | "Other";

export type OnboardingData = {
  name: string;
  role: WorkspaceRole | "";
  businessName: string;
  brandColor: string;
  currency: string;
  defaultProjectStatus: "active" | "draft";
};

export type MockSession = {
  email: string;
  name: string;
  verified: boolean;
  onboardingComplete: boolean;
  onboarding: OnboardingData;
};

const SESSION_KEY = "dueso:session";
const PENDING_EMAIL_KEY = "dueso:pending-email";

const defaultOnboarding = (): OnboardingData => ({
  name: "",
  role: "",
  businessName: "",
  brandColor: "#C8FF3D",
  currency: "USD",
  defaultProjectStatus: "active",
});

export function getSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockSession;
  } catch {
    return null;
  }
}

export function setSession(session: MockSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getPendingEmail(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
}

export function setPendingEmail(email: string) {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email);
}

export function clearPendingEmail() {
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
}

function delay(ms = 500) {
  return new Promise((r) => setTimeout(r, ms));
}

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string; field?: "email" | "password" | "confirm" | "name" | "terms" | "form" };

export async function mockLogin(
  email: string,
  password: string,
): Promise<AuthResult> {
  await delay();
  if (!email.trim()) return { ok: false, error: "Email is required.", field: "email" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  if (!password)
    return { ok: false, error: "Password is required.", field: "password" };
  if (password === "wrong")
    return {
      ok: false,
      error: "Incorrect email or password.",
      field: "form",
    };

  setSession({
    email: email.trim(),
    name: email.split("@")[0] || "Alex",
    verified: true,
    onboardingComplete: true,
    onboarding: {
      ...defaultOnboarding(),
      name: "Alex Johnson",
      businessName: "Acme Studio",
      role: "Freelancer",
    },
  });
  return { ok: true };
}

export async function mockSignUp(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
  terms: boolean;
}): Promise<AuthResult> {
  await delay();
  if (!input.name.trim())
    return { ok: false, error: "Full name is required.", field: "name" };
  if (!input.email.trim())
    return { ok: false, error: "Email is required.", field: "email" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  if (input.email.trim().toLowerCase() === "taken@example.com")
    return {
      ok: false,
      error: "An account with this email already exists.",
      field: "email",
    };
  if (input.password.length < 8)
    return {
      ok: false,
      error: "Password must contain at least 8 characters.",
      field: "password",
    };
  if (input.password !== input.confirm)
    return { ok: false, error: "Passwords do not match.", field: "confirm" };
  if (!input.terms)
    return {
      ok: false,
      error: "Please agree to the Terms to continue.",
      field: "terms",
    };

  setPendingEmail(input.email.trim());
  setSession({
    email: input.email.trim(),
    name: input.name.trim(),
    verified: false,
    onboardingComplete: false,
    onboarding: {
      ...defaultOnboarding(),
      name: input.name.trim(),
    },
  });
  return { ok: true };
}

export async function mockVerifyEmail(): Promise<AuthResult> {
  await delay(400);
  const session = getSession();
  if (!session)
    return { ok: false, error: "Session expired. Please sign up again.", field: "form" };
  setSession({ ...session, verified: true });
  clearPendingEmail();
  return { ok: true };
}

export async function mockResendEmail(): Promise<AuthResult> {
  await delay(400);
  return { ok: true };
}

export async function mockForgotPassword(email: string): Promise<AuthResult> {
  await delay();
  if (!email.trim())
    return { ok: false, error: "Email is required.", field: "email" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  setPendingEmail(email.trim());
  return { ok: true };
}

export async function mockResetPassword(
  password: string,
  confirm: string,
): Promise<AuthResult> {
  await delay();
  if (password.length < 8)
    return {
      ok: false,
      error: "Password must contain at least 8 characters.",
      field: "password",
    };
  if (password !== confirm)
    return { ok: false, error: "Passwords do not match.", field: "confirm" };
  clearPendingEmail();
  return { ok: true };
}

export function updateOnboarding(patch: Partial<OnboardingData>) {
  const session = getSession();
  if (!session) return;
  setSession({
    ...session,
    onboarding: { ...session.onboarding, ...patch },
  });
}

export function completeOnboarding() {
  const session = getSession();
  if (!session) return;
  setSession({ ...session, onboardingComplete: true });
}

export function mockSignOut() {
  clearSession();
  clearPendingEmail();
}
