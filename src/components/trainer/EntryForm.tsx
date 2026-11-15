"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiacriticPicker } from "@/components/drill/DiacriticPicker";
import { ToneChip } from "@/components/drill/ToneChip";
import { InferenceSourcePill } from "@/components/telemetry/InferenceSourcePill";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useHybridModel } from "@/hooks/useHybridModel";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { segmentSyllablesHeuristic } from "@/lib/ai/fallback-quiz";
import {
  getSeedDialect,
  getSeedScenariosByDialect,
  SEED_DIALECTS,
} from "@/lib/db/seed-catalog";
import { extractTonePattern, nfc } from "@/lib/tone/normalize";
import {
  submitTrainerEntry,
  validateTrainerEntryDraft,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";
import type { HybridCallOutcome, TrainerAssist } from "@/types/ai";
import type { DialectId, Tone } from "@/types/domain";

const TONE_OPTIONS: { tone: Tone; label: string; activeClass: string }[] = [
  {
    tone: "H",
    label: "H (High)",
    activeClass: "bg-tone-high text-white border-tone-high",
  },
  {
    tone: "M",
    label: "M (Mid)",
    activeClass: "bg-tone-mid text-white border-tone-mid",
  },
  {
    tone: "L",
    label: "L (Low)",
    activeClass: "bg-tone-low text-white border-tone-low",
  },
];

type PickerTarget = "headword" | "standard" | "example";

export interface EntryFormProps {
  uid: string;
  initialDialectId?: DialectId;
  initialScenarioId?: string;
  onSubmitted?: (submission: TrainerSubmissionRecord, synced: boolean) => void;
}

export function EntryForm({
  uid,
  initialDialectId = "yo-ijebu",
  initialScenarioId = "",
  onSubmitted,
}: EntryFormProps) {
  const online = useOnlineStatus();
  const { assistTrainerEntry } = useHybridModel();

  const [dialectId, setDialectId] = useState<DialectId>(initialDialectId);
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId);
  const [headword, setHeadword] = useState("");
  const [standardForm, setStandardForm] = useState("");
  const [glossEn, setGlossEn] = useState("");
  const [syllables, setSyllables] = useState<string[]>([""]);
  const [tonePattern, setTonePattern] = useState<Tone[]>(["M"]);
  const [exampleLine, setExampleLine] = useState("");
  const [exampleGlossEn, setExampleGlossEn] = useState("");
  const [note, setNote] = useState("");

  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("headword");
  const headwordRef = useRef<HTMLInputElement>(null);
  const standardRef = useRef<HTMLInputElement>(null);
  const exampleRef = useRef<HTMLInputElement>(null);

  const [assistOutcome, setAssistOutcome] =
    useState<HybridCallOutcome<TrainerAssist> | null>(null);
  const [assistBusy, setAssistBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    pendingSync: boolean;
  } | null>(null);

  const dialect = useMemo(() => getSeedDialect(dialectId), [dialectId]);
  const scenariosForDialect = useMemo(
    () => getSeedScenariosByDialect(dialectId),
    [dialectId],
  );

  useEffect(() => {
    if (
      scenarioId &&
      !scenariosForDialect.some((s) => s.scenarioId === scenarioId)
    ) {
      setScenarioId("");
    }
  }, [scenarioId, scenariosForDialect]);

  const activeLanguage = dialect?.languageId ?? "yo";
  const activeRef =
    pickerTarget === "headword"
      ? headwordRef
      : pickerTarget === "standard"
        ? standardRef
        : exampleRef;
  const activeValue =
    pickerTarget === "headword"
      ? headword
      : pickerTarget === "standard"
        ? standardForm
        : exampleLine;

  const handlePickerChange = useCallback(
    (nextValue: string) => {
      if (pickerTarget === "headword") {
        setHeadword(nextValue);
      } else if (pickerTarget === "standard") {
        setStandardForm(nextValue);
      } else {
        setExampleLine(nextValue);
      }
    },
    [pickerTarget],
  );

  const handleAutoSplitSyllables = () => {
    const split = segmentSyllablesHeuristic(headword);
    if (split.length === 0) {
      setSyllables([""]);
      setTonePattern(["M"]);
      return;
    }
    setSyllables(split);
    setTonePattern(extractTonePattern(split));
  };

  const handleSyllableTextChange = (index: number, next: string) => {
    setSyllables((prev) => prev.map((s, idx) => (idx === index ? nfc(next) : s)));
  };

  const handleToneChange = (index: number, tone: Tone) => {
    setTonePattern((prev) => prev.map((t, idx) => (idx === index ? tone : t)));
  };

  const handleAddSyllable = () => {
    if (syllables.length >= 24) return;
    setSyllables((prev) => [...prev, ""]);
    setTonePattern((prev) => [...prev, "M"]);
  };

  const handleRemoveSyllable = (index: number) => {
    if (syllables.length <= 1) return;
    setSyllables((prev) => prev.filter((_, idx) => idx !== index));
    setTonePattern((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRunAiCheck = async () => {
    if (!headword.trim()) {
      setFormErrors(["Enter a dialect headword before running consistency check."]);
      return;
    }
    setFormErrors([]);
    setAssistBusy(true);
    try {
      const result = await assistTrainerEntry({
        dialectId,
        headword,
        glossEn: glossEn.trim() || "dialect expression",
      });
      setAssistOutcome(result);
    } finally {
      setAssistBusy(false);
    }
  };

  const handleApplyAssistSuggestion = () => {
    if (!assistOutcome) return;
    setSyllables(assistOutcome.data.syllables.map((s) => nfc(s)));
    setTonePattern([...assistOutcome.data.suggestedTonePattern]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const draft = {
      dialectId,
      headword,
      standardForm: standardForm.trim() ? standardForm : null,
      glossEn,
      syllables,
      tonePattern,
      exampleLine,
      exampleGlossEn,
      note: note.trim() ? note : null,
      scenarioIds: scenarioId ? [scenarioId] : [],
    };

    const validation = validateTrainerEntryDraft(draft);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);
    setSubmitting(true);
    try {
      const { submission, synced } = await submitTrainerEntry({
        submittedBy: uid,
        draft,
        online,
      });

      setStatusMessage({
        text: synced
          ? `Submitted "${submission.headword}" to peer review queue.`
          : `Saved "${submission.headword}" locally (Will sync when online).`,
        pendingSync: !synced,
      });

      setHeadword("");
      setStandardForm("");
      setGlossEn("");
      setSyllables([""]);
      setTonePattern(["M"]);
      setExampleLine("");
      setExampleGlossEn("");
      setNote("");
      setAssistOutcome(null);
      onSubmitted?.(submission, synced);
    } catch (err: unknown) {
      setFormErrors([
        err instanceof Error ? err.message : "Failed to save trainer submission.",
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>1. Dialect &amp; Headword</CardTitle>
            {!online ? (
              <span className="rounded-full bg-gold-100 px-3 py-1 font-mono text-xs font-medium text-gold-600">
                Offline queue ready (Will sync)
              </span>
            ) : (
              <span className="rounded-full bg-tone-mid-bg px-3 py-1 font-mono text-xs font-medium text-tone-mid">
                Online &middot; NFC normalized
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="trainer-dialect"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Regional dialect
              </label>
              <select
                id="trainer-dialect"
                value={dialectId}
                onChange={(event) => setDialectId(event.target.value as DialectId)}
                className="w-full rounded-[10px] border border-border bg-surface-base px-3 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                {SEED_DIALECTS.map((d) => (
                  <option key={d.dialectId} value={d.dialectId}>
                    {d.name} ({d.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="trainer-scenario"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Scene association (optional)
              </label>
              <select
                id="trainer-scenario"
                value={scenarioId}
                onChange={(event) => setScenarioId(event.target.value)}
                className="w-full rounded-[10px] border border-border bg-surface-base px-3 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                <option value="">General dialect lexicon</option>
                {scenariosForDialect.map((sc) => (
                  <option key={sc.scenarioId} value={sc.scenarioId}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="trainer-headword"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Dialect headword (with tone marks &amp; sub-dots)
              </label>
              <input
                ref={headwordRef}
                id="trainer-headword"
                type="text"
                required
                value={headword}
                onFocus={() => setPickerTarget("headword")}
                onChange={(event) => setHeadword(nfc(event.target.value))}
                placeholder="e.g. Wọn kò rí i"
                className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 font-dialect text-base text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="trainer-standard"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Standard form equivalent (optional)
              </label>
              <input
                ref={standardRef}
                id="trainer-standard"
                type="text"
                value={standardForm}
                onFocus={() => setPickerTarget("standard")}
                onChange={(event) => setStandardForm(nfc(event.target.value))}
                placeholder="Standard Yoruba / Igbo / Hausa form"
                className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 font-dialect text-base text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="trainer-gloss"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              English gloss / meaning
            </label>
            <input
              id="trainer-gloss"
              type="text"
              required
              value={glossEn}
              onChange={(event) => setGlossEn(event.target.value)}
              placeholder="Concise English meaning and register note"
              className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-surface-sunken p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
              <span>
                Active diacritic target:{" "}
                <strong className="font-mono text-indigo-900">
                  {pickerTarget === "headword"
                    ? "Headword"
                    : pickerTarget === "standard"
                      ? "Standard form"
                      : "Example sentence"}
                </strong>
              </span>
              <span className="text-[11px] text-text-muted">
                Focus a field above or below to switch insertion target.
              </span>
            </div>
            <DiacriticPicker
              language={activeLanguage}
              value={activeValue}
              onChange={handlePickerChange}
              targetRef={activeRef}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>2. Syllable Breakdown &amp; Tone Pattern</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoSplitSyllables}
              >
                Auto-split syllables
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRunAiCheck}
                disabled={assistBusy}
              >
                {assistBusy ? "Checking..." : "Run AI Consistency Check"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {syllables.map((syl, index) => (
              <div
                key={`syllable-row-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-sunken p-2.5"
              >
                <span className="w-6 text-center font-mono text-xs text-text-muted">
                  #{index + 1}
                </span>
                <label className="sr-only" htmlFor={`syllable-input-${index}`}>
                  Syllable {index + 1}
                </label>
                <input
                  id={`syllable-input-${index}`}
                  type="text"
                  value={syl}
                  onChange={(event) =>
                    handleSyllableTextChange(index, event.target.value)
                  }
                  placeholder={`Syl ${index + 1}`}
                  className="min-w-28 flex-1 rounded-[10px] border border-border bg-surface-base px-3 py-1.5 font-dialect text-base text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
                />

                <div
                  className="flex items-center gap-1"
                  role="group"
                  aria-label={`Tone for syllable ${index + 1}`}
                >
                  {TONE_OPTIONS.map((opt) => {
                    const selected = tonePattern[index] === opt.tone;
                    return (
                      <button
                        key={opt.tone}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Set syllable ${index + 1} tone ${opt.label}`}
                        onClick={() => handleToneChange(index, opt.tone)}
                        className={[
                          "rounded-[8px] border px-2.5 py-1 font-mono text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500",
                          selected
                            ? opt.activeClass
                            : "border-border bg-surface-raised text-text-secondary hover:bg-indigo-100/50",
                        ].join(" ")}
                      >
                        {opt.tone}
                      </button>
                    );
                  })}
                </div>

                {syllables.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveSyllable(index)}
                    aria-label={`Remove syllable ${index + 1}`}
                    className="rounded-[8px] px-2 py-1 text-xs font-medium text-terracotta-600 hover:bg-terracotta-100/60 focus-visible:outline-2 focus-visible:outline-indigo-500"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSyllable}
              disabled={syllables.length >= 24}
            >
              + Add syllable
            </Button>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-text-muted">Preview:</span>
              {syllables.map((syl, idx) => (
                <ToneChip
                  key={`preview-${idx}`}
                  syllable={syl || "..."}
                  tone={tonePattern[idx] ?? "M"}
                />
              ))}
            </div>
          </div>

          {assistOutcome ? (
            <div
              className="rounded-xl border border-indigo-200 bg-indigo-100/30 p-4 space-y-3"
              aria-live="polite"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
                  AI Orthography &amp; Tone Check (Advisory only)
                </p>
                <InferenceSourcePill
                  source={assistOutcome.source}
                  latencyMs={assistOutcome.latencyMs}
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {assistOutcome.data.syllables.map((syl, idx) => (
                  <ToneChip
                    key={`ai-syl-${idx}`}
                    syllable={syl}
                    tone={assistOutcome.data.suggestedTonePattern[idx] ?? "M"}
                  />
                ))}
              </div>

              {assistOutcome.data.warnings.length > 0 ? (
                <ul className="list-disc pl-5 text-xs text-terracotta-700 space-y-1">
                  {assistOutcome.data.warnings.map((warning, idx) => (
                    <li key={`warn-${idx}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-tone-mid">
                  No orthography inconsistencies flagged. Your human verification
                  remains authoritative.
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleApplyAssistSuggestion}
              >
                Apply suggested split &amp; tones
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Contextual Usage &amp; Cultural Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="trainer-example-line"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Example sentence in dialect (optional)
              </label>
              <input
                ref={exampleRef}
                id="trainer-example-line"
                type="text"
                value={exampleLine}
                onFocus={() => setPickerTarget("example")}
                onChange={(event) => setExampleLine(nfc(event.target.value))}
                placeholder="Natural everyday sentence"
                className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 font-dialect text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="trainer-example-en"
                className="mb-1.5 block text-xs font-medium text-text-secondary"
              >
                Example English translation (optional)
              </label>
              <input
                id="trainer-example-en"
                type="text"
                value={exampleGlossEn}
                onChange={(event) => setExampleGlossEn(event.target.value)}
                placeholder="Natural English translation"
                className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="trainer-note"
              className="mb-1.5 block text-xs font-medium text-text-secondary"
            >
              Reviewer note / phonetic context (optional)
            </label>
            <textarea
              id="trainer-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Explain tone assimilation, elder-respect register, or regional variation"
              className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {formErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-terracotta-500/40 bg-terracotta-100/70 p-4 text-sm text-terracotta-700 space-y-1"
        >
          <p className="font-semibold">Please fix before submitting:</p>
          <ul className="list-disc pl-5 text-xs space-y-0.5">
            {formErrors.map((err, idx) => (
              <li key={`form-err-${idx}`}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className={[
            "rounded-xl border p-4 text-sm font-medium",
            statusMessage.pendingSync
              ? "border-gold-500/50 bg-gold-100 text-gold-600"
              : "border-tone-mid/40 bg-tone-mid-bg text-tone-mid",
          ].join(" ")}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting
            ? "Saving..."
            : online
              ? "Submit for peer review"
              : "Save to offline queue"}
        </Button>
      </div>
    </form>
  );
}
