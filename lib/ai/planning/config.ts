import type { PlannerConfig } from "./planner.types";

/**
 * config.ts — enable/disable and tune the Llama Planning Layer.
 * The layer is off by default unless explicitly configured:
 *  - LLAMA_PLANNING_ENABLED (or NEXT_PUBLIC_LLAMA_PLANNING_ENABLED) = "true"
 *  - or a Llama API key is present in the environment
 * A runtime override is available for UI toggles (see setPlanningEnabled).
 */

function env(name: string): string | undefined {
  return process.env[name] ?? process.env[`NEXT_PUBLIC_${name}`];
}

let runtimeOverride: boolean | null = null;

export function resolvePlannerConfig(overrides: Partial<PlannerConfig> = {}): PlannerConfig {
  const envEnabled = env("LLAMA_PLANNING_ENABLED");
  const envKey = env("LLAMA_API_KEY");
  const hasKey = Boolean(envKey && envKey.length > 0);

  let enabled = overrides.enabled;
  if (enabled === undefined) {
    if (envEnabled !== undefined) enabled = envEnabled.toLowerCase() === "true";
    else enabled = hasKey;
  }

  return {
    enabled: enabled ?? false,
    provider: "llama",
    model: overrides.model ?? env("LLAMA_MODEL") ?? "meta/llama-3.3-70b-instruct",
    baseUrl: overrides.baseUrl ?? env("LLAMA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1",
    apiKey: overrides.apiKey ?? envKey ?? "",
    timeoutMs: overrides.timeoutMs ?? (Number(env("LLAMA_TIMEOUT_MS")) || 120_000),
    maxRetries: overrides.maxRetries ?? (Number(env("LLAMA_MAX_RETRIES")) || 3),
    cacheTtlMs: overrides.cacheTtlMs ?? (Number(env("LLAMA_CACHE_TTL_MS")) || 30 * 60 * 1000),
    maxContextTokens: overrides.maxContextTokens ?? (Number(env("LLAMA_MAX_CONTEXT_TOKENS")) || 12_000),
  };
}

export function isPlanningEnabled(): boolean {
  if (runtimeOverride !== null) return runtimeOverride;
  return resolvePlannerConfig().enabled;
}

/** Runtime toggle (e.g. from the settings UI). `null` restores env-driven value. */
export function setPlanningEnabled(enabled: boolean | null): void {
  runtimeOverride = enabled;
}
