/**
 * Analytics foundation for the marketing landing page.
 * Events are no-ops until a provider is wired (Step 9).
 */

export type LandingAnalyticsEvent =
  | "page_view"
  | "hero_cta_waitlist"
  | "hero_cta_explore"
  | "nav_waitlist"
  | "nav_login"
  | "announcement_click"
  | "explore_product"
  | "demo_view_switch"
  | "portal_demo_interact"
  | "faq_open"
  | "waitlist_cta_clicked"
  | "waitlist_form_opened"
  | "waitlist_form_started"
  | "waitlist_form_submitted"
  | "waitlist_signup_succeeded"
  | "waitlist_signup_duplicate"
  | "waitlist_signup_failed"
  | "waitlist_source"
  | "waitlist_audience_selected"
  // legacy aliases
  | "waitlist_start"
  | "waitlist_complete";

export function trackLanding(
  event: LandingAnalyticsEvent,
  props?: Record<string, string | number | boolean>,
) {
  if (process.env.NODE_ENV === "development") {
    void event;
    void props;
  }
}
