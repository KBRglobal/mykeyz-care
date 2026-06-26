type AnalyticsEvent =
  | "quote_sent"
  | "quote_blocked"
  | "quote_withdrawn"
  | "quote_withdraw_blocked"
  | "quote_edited"
  | "quote_edit_blocked"
  | "price_revealed"
  | "reveal_purchased"
  | "iap_purchase_validated"
  | "availability_changed"
  | "simple_mode_toggled"
  | "route_optimized"
  | "job_completed"
  | "license_uploaded"
  | "verification_submitted"
  | "onboarding_completed"
  | "message_flagged";

type AnalyticsProperties = Record<string, string | number | boolean | null>;

export async function trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    const { PostHog } = await import("posthog-react-native");
    const client = new PostHog(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    });
    client.capture(event, properties);
  } catch {
    return;
  }
}
