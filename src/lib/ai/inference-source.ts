import type { InferenceSourceLabel } from "@/types/ai";

// Maps the SDK response.inferenceSource value ("on_device" | "in_cloud")
// to Sokomu's canonical telemetry label without guessing.
export function normalizeInferenceSource(
  raw: unknown,
): Exclude<InferenceSourceLabel, "CACHED_FALLBACK"> {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("device")) {
    return "ON_DEVICE";
  }
  return "IN_CLOUD";
}
