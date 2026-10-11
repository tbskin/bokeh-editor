import { PostHog } from "posthog-node";

// One-pane observability (PostHog). Keyless (dev/tests/CI) = silent no-op; capturing must never
// throw into a request handler or job.
let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.POSTHOG_API_KEY;
  client = key
    ? new PostHog(key, { host: process.env.POSTHOG_HOST || "https://us.i.posthog.com", flushAt: 1, flushInterval: 3000 })
    : null;
  return client;
}

/** Fire-and-forget event capture. distinctId = the user where known, else `project:<id>`. */
export function track(distinctId: string, event: string, properties?: Record<string, unknown>): void {
  try {
    getClient()?.capture({ distinctId, event, properties });
  } catch { /* observing must never break the observed */ }
}
