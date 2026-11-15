import { describe, expect, test } from "bun:test";
import { computePcmPeaks } from "../src/components/audio/DualSpeakerPlayer";
import {
  insertDiacriticOrToneAtCaret,
  LANGUAGE_SPECIAL_LETTERS,
} from "../src/components/drill/DiacriticPicker";

describe("Dual-Speaker PCM waveform peaks and DiacriticPicker NFC input (U-11)", () => {
  test("computePcmPeaks computes normalized waveform bars from 16-bit PCM bytes", () => {
    const emptyPeaks = computePcmPeaks(new Uint8Array(0), 24);
    expect(emptyPeaks.length).toBe(24);

    const buffer = new ArrayBuffer(160);
    const view = new DataView(buffer);
    for (let i = 0; i < 80; i += 1) {
      view.setInt16(i * 2, i % 2 === 0 ? 16384 : -16384, true);
    }
    const peaks = computePcmPeaks(new Uint8Array(buffer), 16);
    expect(peaks.length).toBe(16);
    expect(peaks[0]).toBeGreaterThan(0.4);
    expect(peaks[0]).toBeLessThanOrEqual(1);
  });

  test("insertDiacriticOrToneAtCaret inserts NFC letters and applies/clears tones while preserving dot-below", () => {
    expect(LANGUAGE_SPECIAL_LETTERS.yo.length).toBe(6);
    expect(LANGUAGE_SPECIAL_LETTERS.ig.length).toBe(8);
    expect(LANGUAGE_SPECIAL_LETTERS.ha.length).toBe(9);

    // Step 1: Insert ọ
    const step1 = insertDiacriticOrToneAtCaret("", 0, 0, {
      kind: "letter",
      char: "\u1ECD",
    });
    expect(step1.value).toBe("\u1ECD");

    // Step 2: Type k then insert ọ -> ọkọ
    const baseWord = "\u1ECDk\u1ECD";
    // Apply Low tone to final ọ -> ọkọ̀ (vehicle)
    const withLow = insertDiacriticOrToneAtCaret(
      baseWord,
      baseWord.length,
      baseWord.length,
      { kind: "tone", tone: "L" },
    );
    expect(withLow.value).toBe("\u1ECDk\u1ECD\u0300".normalize("NFC"));

    // Replace Low tone with High tone on final ọ -> ọkọ́ (hoe)
    const withHigh = insertDiacriticOrToneAtCaret(
      withLow.value,
      withLow.value.length,
      withLow.value.length,
      { kind: "tone", tone: "H" },
    );
    expect(withHigh.value).toBe("\u1ECDk\u1ECD\u0301".normalize("NFC"));

    // Clear tone mark on final ọ -> returns to ọkọ (dot-below preserved!)
    const cleared = insertDiacriticOrToneAtCaret(
      withHigh.value,
      withHigh.value.length,
      withHigh.value.length,
      { kind: "clear_tone" },
    );
    expect(cleared.value).toBe("\u1ECDk\u1ECD".normalize("NFC"));
  });
});
