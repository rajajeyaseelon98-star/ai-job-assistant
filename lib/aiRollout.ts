function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const v = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return fallback;
}

function hashPercent(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

export function isAiPromptSystemEnabled(rolloutKey?: string): boolean {
  const enabled = parseBooleanEnv(process.env.AI_PROMPT_SYSTEM_ENABLED, true);
  if (!enabled) return false;

  const canaryPercentRaw = Number(process.env.AI_PROMPT_CANARY_PERCENT ?? "100");
  const canaryPercent = Number.isFinite(canaryPercentRaw)
    ? Math.max(0, Math.min(100, Math.floor(canaryPercentRaw)))
    : 100;
  if (canaryPercent >= 100) return true;
  if (canaryPercent <= 0) return false;
  if (!rolloutKey) return false;
  return hashPercent(rolloutKey) < canaryPercent;
}

export function isAiTelemetryEnabled(): boolean {
  return parseBooleanEnv(process.env.AI_PROMPT_TELEMETRY_ENABLED, false);
}

export function isAiUsageTrackingEnabled(): boolean {
  return parseBooleanEnv(process.env.AI_USAGE_TRACKING_ENABLED, true);
}

export function isAiCreditsEnforcementEnabled(): boolean {
  return parseBooleanEnv(process.env.AI_CREDITS_ENFORCEMENT_ENABLED, false);
}

