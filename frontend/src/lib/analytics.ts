import PostHog from "posthog-react-native";

// One-pane observability (PostHog). No provider/context needed for manual capture, and keyless
// (Expo Go without env, contributors) = null client = every call below no-ops.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";
export const posthog = KEY
  ? new PostHog(KEY, { host: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com" })
  : null;

/** Fire-and-forget UI event. Server-driven facts (project_created, refines, shares, failures) are
 *  captured server-side — the app only reports what the SERVER can't see. */
export function track(event: string, properties?: Record<string, string | number | boolean | null>): void {
  try { posthog?.capture(event, properties); } catch { /* never break the UI over telemetry */ }
}

export function identifyUser(id: string, email?: string): void {
  try { posthog?.identify(id, email ? { email } : undefined); } catch { /* ditto */ }
}

export function resetUser(): void {
  try { posthog?.reset(); } catch { /* ditto */ }
}
