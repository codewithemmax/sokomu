"use client";

export const EXPECTED_IO = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
} as const;

export async function checkNanoAvailability(): Promise<
  LanguageModelAvailability | "unsupported"
> {
  if (
    typeof window === "undefined" ||
    typeof globalThis.LanguageModel === "undefined"
  ) {
    return "unsupported";
  }

  try {
    return await globalThis.LanguageModel.availability({
      expectedInputs: [...EXPECTED_IO.expectedInputs],
      expectedOutputs: [...EXPECTED_IO.expectedOutputs],
    });
  } catch {
    return "unavailable";
  }
}

// Must be called inside a user activation handler when availability is "downloadable".
export async function downloadNano(
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("downloadNano must run in the browser.");
  }
  const lm = globalThis.LanguageModel;
  if (!lm) {
    throw new Error("Chrome built-in AI is not supported in this browser.");
  }

  const session = await lm.create({
    expectedInputs: [...EXPECTED_IO.expectedInputs],
    expectedOutputs: [...EXPECTED_IO.expectedOutputs],
    signal,
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        const raw =
          typeof event.total === "number" && event.total > 0
            ? event.loaded / event.total
            : event.loaded;
        const clamped = Number.isFinite(raw)
          ? Math.max(0, Math.min(1, raw))
          : 0;
        onProgress(clamped);
      });
    },
  });

  // Firebase AI Logic manages its own on-device session; destroy the warmup session.
  session.destroy();
}
