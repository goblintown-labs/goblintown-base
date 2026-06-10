import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface TelemetryEvent {
  event: string;
  source?: string;
  route?: string;
  trigger?: string;
  mode?: string;
  requested?: boolean;
  runId?: string;
  status?: string;
  detail?: Record<string, unknown>;
}

export function telemetryEventsPath(root: string): string {
  return join(root, ".goblintown", "telemetry", "events.jsonl");
}

export async function recordTelemetry(root: string, event: TelemetryEvent): Promise<void> {
  if (!event.event.trim()) {
    return;
  }

  const path = telemetryEventsPath(root);
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, JSON.stringify(cleanEvent(event)) + "\n", "utf8");
}

function cleanEvent(event: TelemetryEvent): Record<string, unknown> {
  const clean: Record<string, unknown> = {
    ts: new Date().toISOString(),
    event: clampString(event.event, 120),
  };

  for (const key of ["source", "route", "trigger", "mode", "runId", "status"] as const) {
    const value = event[key];
    if (typeof value === "string" && value.trim()) {
      clean[key] = clampString(value, 160);
    }
  }
  if (typeof event.requested === "boolean") {
    clean.requested = event.requested;
  }
  if (event.detail) {
    const detail = cleanRecord(event.detail, 0);
    if (Object.keys(detail).length > 0) {
      clean.detail = detail;
    }
  }
  return clean;
}

function cleanRecord(input: Record<string, unknown>, depth: number): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input).slice(0, 60)) {
    if (!key || isSensitiveKey(key)) {
      continue;
    }
    const clean = cleanValue(value, depth);
    if (typeof clean !== "undefined") {
      output[clampString(key, 80)] = clean;
    }
  }
  return output;
}

function cleanValue(value: unknown, depth: number): unknown {
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    return clampString(value, 240);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => cleanValue(entry, depth + 1)).filter((entry) => typeof entry !== "undefined");
  }
  if (typeof value === "object" && depth < 2) {
    return cleanRecord(value as Record<string, unknown>, depth + 1);
  }
  return undefined;
}

function clampString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower === "body" ||
    lower === "content" ||
    lower === "message" ||
    lower === "messages" ||
    lower === "prompt" ||
    lower === "task" ||
    lower.includes("api_key") ||
    lower.includes("apikey") ||
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("token") ||
    lower.endsWith("key")
  );
}
