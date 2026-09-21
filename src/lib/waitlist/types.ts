export const WAITLIST_AUDIENCES = [
  "Freelancer",
  "Agency",
  "Studio",
  "Consultant",
  "Developer",
  "Designer",
  "Other",
] as const;

export type WaitlistAudience = (typeof WAITLIST_AUDIENCES)[number];

export type WaitlistSource =
  | "hero"
  | "navigation"
  | "announcement"
  | "product_demo"
  | "client_portal"
  | "final_cta"
  | "footer"
  | "inline_section"
  | "pricing";

export type WaitlistUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export type WaitlistEntry = {
  id: string;
  email: string;
  audience: WaitlistAudience | null;
  source: WaitlistSource | null;
  utm: WaitlistUtm;
  consent: boolean;
  status: "new" | "contacted" | "invited" | "joined_beta";
  createdAt: string;
};

export type WaitlistSubmitInput = {
  email: string;
  audience?: WaitlistAudience | "";
  source?: WaitlistSource;
  consent: boolean;
  /** Honeypot — must stay empty */
  companyWebsite?: string;
  utm?: WaitlistUtm;
};

export type WaitlistSubmitResult =
  | { ok: true; status: "created" | "duplicate" }
  | {
      ok: false;
      status: "validation" | "offline" | "rate_limited" | "error";
      message: string;
      field?: "email" | "consent";
    };
