import type { Tone } from "@/types/domain";

export const ACUTE = "\u0301";
export const GRAVE = "\u0300";
export const MACRON = "\u0304";
export const DOT_BELOW = "\u0323";

const COMBINING_MARK_RE = /[\u0300-\u036f]/;
const TONE_MARKS_RE = new RegExp(`[${ACUTE}${GRAVE}${MACRON}]`, "g");
const ALL_TONE_AND_SUBDOT_RE = new RegExp(
  `[${ACUTE}${GRAVE}${MACRON}${DOT_BELOW}\u0302\u030C]`,
  "g",
);
const VOWEL_BASE_RE = /[aeiouAEIOU]/;
const NASAL_BASE_RE = /[mnMN]/;

export const nfc = (s: string): string => s.normalize("NFC");

export const nfd = (s: string): string => s.normalize("NFD");

export function toneOfSyllable(syllable: string): Tone {
  const decomposed = nfd(syllable);
  if (decomposed.includes(ACUTE)) return "H";
  if (decomposed.includes(GRAVE)) return "L";
  // Both unmarked vowels and explicit macron vowels represent Mid tone in Yoruba.
  return "M";
}

export function stripTones(s: string): string {
  // Keeps U+0323 dot-below intact so sub-dot orthography remains required.
  return nfc(nfd(s).replace(TONE_MARKS_RE, ""));
}

export function stripAllDiacritics(s: string): string {
  return nfc(nfd(s).replace(ALL_TONE_AND_SUBDOT_RE, ""));
}

export function splitGraphemeClusters(s: string): string[] {
  const decomposed = nfd(s);
  const clusters: string[] = [];
  for (const ch of decomposed) {
    if (COMBINING_MARK_RE.test(ch) && clusters.length > 0) {
      clusters[clusters.length - 1] += ch;
    } else {
      clusters.push(ch);
    }
  }
  return clusters.map(nfc);
}

export function applyToneToSyllable(
  syllable: string,
  tone: Tone,
  showMidMacron = false,
): string {
  const withoutTones = stripTones(syllable);
  const clusters = splitGraphemeClusters(withoutTones);
  if (clusters.length === 0) return withoutTones;

  let targetIndex = clusters.findIndex((cluster) => {
    const base = nfd(cluster)[0] ?? "";
    return VOWEL_BASE_RE.test(base);
  });

  if (targetIndex === -1) {
    targetIndex = clusters.findIndex((cluster) => {
      const base = nfd(cluster)[0] ?? "";
      return NASAL_BASE_RE.test(base);
    });
  }

  if (targetIndex === -1) {
    targetIndex = clusters.length - 1;
  }

  const mark =
    tone === "H"
      ? ACUTE
      : tone === "L"
        ? GRAVE
        : showMidMacron
          ? MACRON
          : "";

  if (!mark) {
    return nfc(clusters.join(""));
  }

  const updated = clusters.map((cluster, idx) =>
    idx === targetIndex ? nfc(nfd(cluster) + mark) : cluster,
  );
  return nfc(updated.join(""));
}

export function extractTonePattern(syllables: readonly string[]): Tone[] {
  return syllables.map((syl) => toneOfSyllable(syl));
}
