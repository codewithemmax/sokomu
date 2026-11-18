"use client";

import { useEffect, type RefObject } from "react";
import { useRemoteConfigBoolean } from "@/hooks/useRemoteConfigValue";
import {
  ACUTE,
  GRAVE,
  MACRON,
  nfc,
  nfd,
  splitGraphemeClusters,
  stripTones,
} from "@/lib/tone/normalize";
import type { LanguageId, Tone } from "@/types/domain";

export type DiacriticAction =
  | { kind: "letter"; char: string }
  | { kind: "tone"; tone: Tone }
  | { kind: "clear_tone" };

export interface CaretEditResult {
  value: string;
  caret: number;
}

export const LANGUAGE_SPECIAL_LETTERS: Record<
  LanguageId,
  readonly { char: string; label: string }[]
> = {
  yo: [
    { char: "\u1EB9", label: "Insert e with dot below" },
    { char: "\u1ECD", label: "Insert o with dot below" },
    { char: "\u1E63", label: "Insert s with dot below" },
    { char: "\u1EB8", label: "Insert capital E with dot below" },
    { char: "\u1ECC", label: "Insert capital O with dot below" },
    { char: "\u1E62", label: "Insert capital S with dot below" },
  ],
  ig: [
    { char: "\u1ECB", label: "Insert i with dot below" },
    { char: "\u1ECD", label: "Insert o with dot below" },
    { char: "\u1EE5", label: "Insert u with dot below" },
    { char: "\u1E45", label: "Insert n with overdot" },
    { char: "\u1ECA", label: "Insert capital I with dot below" },
    { char: "\u1ECC", label: "Insert capital O with dot below" },
    { char: "\u1EE4", label: "Insert capital U with dot below" },
    { char: "\u1E44", label: "Insert capital N with overdot" },
  ],
  ha: [
    { char: "\u0253", label: "Insert hooked b" },
    { char: "\u0257", label: "Insert hooked d" },
    { char: "\u0199", label: "Insert hooked k" },
    { char: "\u01B4", label: "Insert hooked y" },
    { char: "\u02BC", label: "Insert glottal apostrophe" },
    { char: "\u0181", label: "Insert capital hooked B" },
    { char: "\u018A", label: "Insert capital hooked D" },
    { char: "\u0198", label: "Insert capital hooked K" },
    { char: "\u01B3", label: "Insert capital hooked Y" },
  ],
  pcm: [],
};

export function insertDiacriticOrToneAtCaret(
  currentValue: string,
  selectionStart: number,
  selectionEnd: number,
  action: DiacriticAction,
  showMidMacron = false,
): CaretEditResult {
  const safeStart = Math.max(0, Math.min(currentValue.length, selectionStart));
  const safeEnd = Math.max(safeStart, Math.min(currentValue.length, selectionEnd));

  const before = currentValue.slice(0, safeStart);
  const after = currentValue.slice(safeEnd);

  if (action.kind === "letter") {
    const inserted = nfc(action.char);
    const nextBefore = nfc(before + inserted);
    const full = nfc(nextBefore + after);
    return {
      value: full,
      caret: nextBefore.length,
    };
  }

  const clusters = splitGraphemeClusters(before);
  if (clusters.length === 0) {
    return { value: nfc(currentValue), caret: safeStart };
  }

  const lastIdx = clusters.length - 1;
  const lastClusterClean = stripTones(clusters[lastIdx] ?? "");

  if (action.kind === "clear_tone") {
    clusters[lastIdx] = lastClusterClean;
    const nextBefore = nfc(clusters.join(""));
    return {
      value: nfc(nextBefore + after),
      caret: nextBefore.length,
    };
  }

  const mark =
    action.tone === "H"
      ? ACUTE
      : action.tone === "L"
        ? GRAVE
        : showMidMacron
          ? MACRON
          : "";

  clusters[lastIdx] = mark
    ? nfc(nfd(lastClusterClean) + mark)
    : lastClusterClean;

  const nextBefore = nfc(clusters.join(""));
  return {
    value: nfc(nextBefore + after),
    caret: nextBefore.length,
  };
}

export interface DiacriticPickerProps {
  language: LanguageId;
  value: string;
  onChange: (nextValue: string) => void;
  targetRef?: RefObject<HTMLInputElement | null>;
}

export function DiacriticPicker({
  language,
  value,
  onChange,
  targetRef,
}: DiacriticPickerProps) {
  const showMidMacron = useRemoteConfigBoolean("show_mid_macron");
  const letters = LANGUAGE_SPECIAL_LETTERS[language] ?? [];
  const supportsToneKeys = language === "yo" || language === "ig";

  const applyAction = (action: DiacriticAction) => {
    const inputEl = targetRef?.current;
    const start = inputEl?.selectionStart ?? value.length;
    const end = inputEl?.selectionEnd ?? value.length;
    const result = insertDiacriticOrToneAtCaret(
      value,
      start,
      end,
      action,
      showMidMacron,
    );
    onChange(result.value);

    if (inputEl && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        inputEl.focus();
        inputEl.setSelectionRange(result.caret, result.caret);
      });
    }
  };

  useEffect(() => {
    const inputEl = targetRef?.current;
    if (!inputEl) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === "1" && supportsToneKeys) {
        event.preventDefault();
        applyAction({ kind: "tone", tone: "H" });
      } else if (event.key === "2" && supportsToneKeys) {
        event.preventDefault();
        applyAction({ kind: "tone", tone: "M" });
      } else if (event.key === "3" && supportsToneKeys) {
        event.preventDefault();
        applyAction({ kind: "tone", tone: "L" });
      } else if (event.key === "0" && supportsToneKeys) {
        event.preventDefault();
        applyAction({ kind: "clear_tone" });
      }
    };

    inputEl.addEventListener("keydown", onKeyDown);
    return () => {
      inputEl.removeEventListener("keydown", onKeyDown);
    };
  });

  if (letters.length === 0 && !supportsToneKeys) {
    return null;
  }

  const handleToolbarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target || target.tagName !== "BUTTON") return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    if (buttons.length <= 1) return;
    const currentIndex = buttons.indexOf(target as HTMLButtonElement);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    }

    if (nextIndex !== -1) {
      event.preventDefault();
      buttons[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Indigenous diacritic and tone keyboard"
      onKeyDown={handleToolbarKeyDown}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-base p-3"
    >
      {letters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Letters:</span>
          {letters.map((item) => (
            <button
              key={item.char}
              type="button"
              aria-label={item.label}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => applyAction({ kind: "letter", char: item.char })}
              className="tonal-text inline-flex size-11 items-center justify-center rounded-[var(--radius-input)] border border-border bg-surface-raised text-xl font-medium text-text-primary transition-transform active:scale-95 hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
            >
              {item.char}
            </button>
          ))}
        </div>
      ) : null}

      {supportsToneKeys ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-muted">Tones:</span>
          <button
            type="button"
            aria-label="Apply high tone (acute mark, Alt+1)"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => applyAction({ kind: "tone", tone: "H" })}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-input)] border border-tone-high/30 bg-surface-raised px-3 text-sm font-semibold text-tone-high hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
          >
            <span>{"\u25CC\u0301 High"}</span>
            <sub className="text-xs">H</sub>
          </button>
          <button
            type="button"
            aria-label="Apply mid tone (Alt+2)"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => applyAction({ kind: "tone", tone: "M" })}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-input)] border border-tone-mid/30 bg-surface-raised px-3 text-sm font-semibold text-tone-mid hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
          >
            <span>{showMidMacron ? "\u25CC\u0304 Mid" : "Mid"}</span>
            <sub className="text-xs">M</sub>
          </button>
          <button
            type="button"
            aria-label="Apply low tone (grave mark, Alt+3)"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => applyAction({ kind: "tone", tone: "L" })}
            className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-input)] border border-tone-low/30 bg-surface-raised px-3 text-sm font-semibold text-tone-low hover:bg-surface-base focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
          >
            <span>{"\u25CC\u0300 Low"}</span>
            <sub className="text-xs">L</sub>
          </button>
          <button
            type="button"
            aria-label="Clear tone mark from character before cursor (Alt+0)"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => applyAction({ kind: "clear_tone" })}
            className="inline-flex h-11 items-center rounded-[var(--radius-input)] border border-border bg-surface-raised px-3 text-xs font-medium text-text-secondary hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-focus cursor-pointer"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}
