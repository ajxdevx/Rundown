import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/waitlist/rateLimit";
import {
  addWaitlistEntry,
  findWaitlistByEmail,
  notifyWaitlistWebhook,
} from "@/lib/waitlist/store";
import type {
  WaitlistEntry,
  WaitlistSource,
  WaitlistSubmitInput,
  WaitlistUtm,
} from "@/lib/waitlist/types";
import {
  isWaitlistAudience,
  normalizeEmail,
  validateEmail,
} from "@/lib/waitlist/validate";

export const runtime = "nodejs";

const SOURCES: WaitlistSource[] = [
  "hero",
  "navigation",
  "announcement",
  "product_demo",
  "client_portal",
  "final_cta",
  "footer",
  "inline_section",
  "pricing",
];

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return `waitlist:${ip}`;
}

function parseUtm(raw: unknown): WaitlistUtm {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const utm: WaitlistUtm = {};
  for (const key of ["source", "medium", "campaign", "content", "term"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) utm[key] = v.trim().slice(0, 120);
  }
  return utm;
}

export async function POST(req: Request) {
  const limited = checkRateLimit(clientKey(req));
  if (!limited.ok) {
    return NextResponse.json(
      {
        status: "rate_limited",
        message: "Too many attempts. Please try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limited.retryAfterMs / 1000)),
        },
      },
    );
  }

  let body: WaitlistSubmitInput;
  try {
    body = (await req.json()) as WaitlistSubmitInput;
  } catch {
    return NextResponse.json(
      { status: "validation", message: "Invalid request.", field: "email" },
      { status: 400 },
    );
  }

  // Honeypot — bots fill this; humans never see it.
  if (body.companyWebsite && String(body.companyWebsite).trim()) {
    return NextResponse.json({ status: "created" }, { status: 201 });
  }

  const emailError = validateEmail(String(body.email ?? ""));
  if (emailError) {
    return NextResponse.json(
      { status: "validation", message: emailError, field: "email" },
      { status: 400 },
    );
  }

  if (!body.consent) {
    return NextResponse.json(
      {
        status: "validation",
        message: "Please confirm you want to receive early access updates.",
        field: "consent",
      },
      { status: 400 },
    );
  }

  const email = normalizeEmail(String(body.email));
  const audienceRaw = body.audience ? String(body.audience) : "";
  const audience =
    audienceRaw && isWaitlistAudience(audienceRaw) ? audienceRaw : null;
  const source =
    body.source && SOURCES.includes(body.source) ? body.source : null;
  const utm = parseUtm(body.utm);

  const existing = await findWaitlistByEmail(email);
  if (existing) {
    return NextResponse.json({ status: "duplicate" }, { status: 200 });
  }

  const entry: WaitlistEntry = {
    id: `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    audience,
    source,
    utm,
    consent: true,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  try {
    const result = await addWaitlistEntry(entry);
    if (result === "duplicate") {
      return NextResponse.json({ status: "duplicate" }, { status: 200 });
    }
    void notifyWaitlistWebhook(entry);
    return NextResponse.json({ status: "created" }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "We couldn't add you right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
