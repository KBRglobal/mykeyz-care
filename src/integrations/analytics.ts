type AnalyticsEvent =
  | "login"
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

// Lazily-created module-level singleton. PostHog is dynamically imported the first
// time analytics is used so a missing native module never crashes the JS bundle, and
// the client is reused across calls instead of constructed on every event.
let clientPromise: Promise<unknown> | null = null;

async function getClient(): Promise<{
  capture: (event: string, properties?: AnalyticsProperties) => void;
  identify: (distinctId: string) => void;
  reset: () => void;
} | null> {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!clientPromise) {
    clientPromise = (async () => {
      const { PostHog } = await import("posthog-react-native");
      return new PostHog(key, {
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      });
    })();
  }

  try {
    return (await clientPromise) as never;
  } catch {
    // Reset so a transient import failure can be retried on the next call.
    clientPromise = null;
    return null;
  }
}

export async function trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  try {
    const client = await getClient();
    if (!client) return;
    client.capture(event, properties);
  } catch {
    return;
  }
}

export async function identify(distinctId: string) {
  if (!distinctId) return;
  try {
    const client = await getClient();
    if (!client) return;
    client.identify(distinctId);
  } catch {
    return;
  }
}

export async function reset() {
  try {
    const client = await getClient();
    if (!client) return;
    client.reset();
  } catch {
    return;
  }
}
