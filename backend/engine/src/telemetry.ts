import { PostHog } from "posthog-node";

// One-pane observability: everything lands in PostHog. Keyless (dev, tests, CI) = a silent no-op;
// telemetry must never throw into — or slow down — the pipeline it observes.
let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.POSTHOG_API_KEY;
  client = key
    ? new PostHog(key, { host: process.env.POSTHOG_HOST || "https://us.i.posthog.com", flushAt: 1, flushInterval: 3000 })
    : null;
  return client;
}

/** Fire-and-forget event capture. */
export function track(distinctId: string, event: string, properties?: Record<string, unknown>): void {
  try {
    getClient()?.capture({ distinctId, event, properties });
  } catch { /* observing must never break the observed */ }
}

/** An AI model call, in PostHog's LLM-analytics shape ($ai_* properties drive its cost/latency UI). */
export function trackAiGeneration(p: {
  distinctId?: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  purpose: string; // analyze | plan | watch | refine-agent | ...
}): void {
  track(p.distinctId ?? "engine", "$ai_generation", {
    $ai_model: p.model,
    $ai_provider: p.provider,
    $ai_input_tokens: p.inputTokens,
    $ai_output_tokens: p.outputTokens,
    $ai_latency: p.latencyMs / 1000,
    purpose: p.purpose,
  });
}
