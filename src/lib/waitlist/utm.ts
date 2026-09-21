import type { WaitlistUtm } from "./types";

const UTM_KEY = "dueso_waitlist_utm";

export function readUtmFromLocation(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): WaitlistUtm {
  const params = new URLSearchParams(search);
  const utm: WaitlistUtm = {};
  const source = params.get("utm_source")?.trim();
  const medium = params.get("utm_medium")?.trim();
  const campaign = params.get("utm_campaign")?.trim();
  const content = params.get("utm_content")?.trim();
  const term = params.get("utm_term")?.trim();
  if (source) utm.source = source;
  if (medium) utm.medium = medium;
  if (campaign) utm.campaign = campaign;
  if (content) utm.content = content;
  if (term) utm.term = term;
  return utm;
}

export function captureUtmToSession(): WaitlistUtm {
  if (typeof window === "undefined") return {};
  const fromUrl = readUtmFromLocation();
  const hasAny = Object.keys(fromUrl).length > 0;
  if (hasAny) {
    try {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    } catch {
      /* private mode */
    }
    return fromUrl;
  }
  return getStoredUtm();
}

export function getStoredUtm(): WaitlistUtm {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WaitlistUtm;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
