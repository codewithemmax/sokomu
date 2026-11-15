"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ToneChip } from "@/components/drill/ToneChip";
import { Drawer } from "@/components/ui/Drawer";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRemoteConfigBoolean } from "@/hooks/useRemoteConfigValue";
import { loadGlossaryForDialect } from "@/lib/db/glossary-cache";
import { getSeedDialect } from "@/lib/db/seed-catalog";
import { nfc, stripAllDiacritics } from "@/lib/tone/normalize";
import {
  listTrainerSubmissions,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";
import type { DialectId, GlossaryEntry } from "@/types/domain";

type DictionaryFilter = "verified" | "pending" | "scene";

export interface DictionaryDrawerProps {
  open: boolean;
  onClose: () => void;
  dialectId: DialectId;
  scenarioId?: string;
  initialFilter?: DictionaryFilter;
}

function matchesSearch(
  query: string,
  fields: readonly (string | null | undefined)[],
): boolean {
  const q = stripAllDiacritics(nfc(query).trim()).toLowerCase();
  if (!q) return true;
  return fields.some((field) => {
    if (!field) return false;
    return stripAllDiacritics(nfc(field)).toLowerCase().includes(q);
  });
}

export function DictionaryDrawer({
  open,
  onClose,
  dialectId,
  scenarioId,
  initialFilter,
}: DictionaryDrawerProps) {
  const online = useOnlineStatus();
  const trainerPortalEnabled = useRemoteConfigBoolean("feature_trainer_portal");

  const defaultFilter: DictionaryFilter =
    initialFilter ?? (scenarioId ? "scene" : "verified");

  const [filter, setFilter] = useState<DictionaryFilter>(defaultFilter);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<
    TrainerSubmissionRecord[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFilter(initialFilter ?? (scenarioId ? "scene" : "verified"));
  }, [open, initialFilter, scenarioId]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    void Promise.all([
      loadGlossaryForDialect(dialectId),
      listTrainerSubmissions({
        dialectId,
        status: "pending",
        online,
      }),
    ])
      .then(([loadedGlossary, pending]) => {
        if (!active) return;
        setEntries(loadedGlossary);
        setPendingSubmissions(pending);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, dialectId, online]);

  const dialect = getSeedDialect(dialectId);

  const filteredVerified = useMemo(() => {
    return entries.filter((entry) => {
      if (filter === "scene" && scenarioId) {
        if (!entry.scenarioIds.includes(scenarioId)) {
          return false;
        }
      }
      return matchesSearch(search, [
        entry.headword,
        entry.standardForm,
        entry.glossEn,
        entry.example?.text,
        entry.example?.translation,
      ]);
    });
  }, [entries, filter, scenarioId, search]);

  const filteredPending = useMemo(() => {
    return pendingSubmissions.filter((sub) => {
      if (filter === "scene" && scenarioId) {
        const matchesScene = sub.scenarioIds?.includes(scenarioId) ?? false;
        if (!matchesScene) {
          return false;
        }
      }
      return matchesSearch(search, [
        sub.headword,
        sub.standardForm,
        sub.glossEn,
        sub.example?.text,
        sub.example?.translation,
      ]);
    });
  }, [pendingSubmissions, filter, scenarioId, search]);

  const showVerified = filter === "verified" || filter === "scene";
  const showPending = filter === "pending" || filter === "scene";

  const filterButtons: { id: DictionaryFilter; label: string; count: number }[] = [
    { id: "verified", label: "Verified", count: entries.length },
    { id: "pending", label: "Pending", count: pendingSubmissions.length },
  ];
  if (scenarioId) {
    const sceneCount =
      entries.filter((e) => e.scenarioIds.includes(scenarioId)).length +
      pendingSubmissions.filter((s) => s.scenarioIds?.includes(scenarioId)).length;
    filterButtons.unshift({
      id: "scene",
      label: "This scene",
      count: sceneCount,
    });
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`${dialect?.name ?? dialectId} dictionary`}
      subtitle={
        dialect
          ? `${dialect.region} regional lexicon and peer-reviewed trainer entries`
          : "Regional lexicon"
      }
      footer={
        trainerPortalEnabled ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-secondary">
              Spotted a regional variant or missing tone?
            </span>
            <Link
              href={`/trainer/submit?dialectId=${encodeURIComponent(dialectId)}${
                scenarioId ? `&scenarioId=${encodeURIComponent(scenarioId)}` : ""
              }`}
              onClick={onClose}
              className="inline-flex items-center rounded-[10px] bg-indigo-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              Trainer: add word &rarr;
            </Link>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="dictionary-search" className="sr-only">
            Search dictionary entries
          </label>
          <input
            id="dictionary-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dialect words or English..."
            className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-indigo-500"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Dictionary filters"
        >
          {filterButtons.map((btn) => {
            const active = filter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(btn.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500",
                  active
                    ? "bg-indigo-500 text-white"
                    : "border border-border bg-surface-sunken text-text-secondary hover:bg-indigo-100/50",
                ].join(" ")}
              >
                <span>{btn.label}</span>
                <span className="font-mono text-[11px] opacity-85">
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-text-muted" role="status">
            Loading cached dialect dictionary...
          </p>
        ) : null}

        {!loading &&
        ((showVerified ? filteredVerified.length : 0) +
          (showPending ? filteredPending.length : 0) ===
          0) ? (
          <div className="rounded-xl border border-border bg-surface-sunken p-4 text-sm text-text-secondary">
            No matching entries found in this filter. Try switching to Verified
            or clearing the search box.
          </div>
        ) : null}

        <div className="space-y-3">
          {showPending &&
            filteredPending.map((sub) => (
              <article
                key={sub.submissionId}
                className="rounded-xl border border-gold-400/60 bg-surface-sunken p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="tonal-text text-xl font-semibold text-indigo-900">
                      {sub.headword}
                    </p>
                    <p className="text-sm text-text-primary">{sub.glossEn}</p>
                    {sub.standardForm ? (
                      <p className="text-xs text-text-muted">
                        Standard form:{" "}
                        <span className="tonal-text">{sub.standardForm}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-gold-100 px-2.5 py-0.5 font-mono text-[11px] font-medium text-offline-600">
                      Pending peer review
                    </span>
                    {sub.pendingSync ? (
                      <span className="rounded-full bg-surface-raised border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-secondary">
                        Will sync
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sub.syllables.map((syllable, idx) => (
                    <ToneChip
                      key={`${sub.submissionId}-syl-${idx}`}
                      syllable={syllable}
                      tone={sub.tonePattern[idx] ?? "M"}
                    />
                  ))}
                </div>
                {sub.example ? (
                  <p className="rounded-lg bg-surface-raised px-3 py-2 text-xs text-text-secondary">
                    <span className="tonal-text font-medium text-text-primary">
                      {sub.example.text}
                    </span>{" "}
                    &middot; {sub.example.translation}
                  </p>
                ) : null}
              </article>
            ))}

          {showVerified &&
            filteredVerified.map((entry) => (
              <article
                key={entry.entryId}
                className="rounded-xl border border-border bg-surface-raised p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="tonal-text text-xl font-semibold text-indigo-900">
                      {entry.headword}
                    </p>
                    <p className="text-sm text-text-primary">{entry.glossEn}</p>
                    {entry.standardForm ? (
                      <p className="text-xs text-text-muted">
                        Standard form:{" "}
                        <span className="tonal-text">{entry.standardForm}</span>
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={[
                      "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium",
                      entry.source === "trainer"
                        ? "bg-edge-100 text-edge-600"
                        : "bg-indigo-100/70 text-indigo-700",
                    ].join(" ")}
                  >
                    {entry.source === "trainer"
                      ? "Verified (trainer)"
                      : "Verified (seed)"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.syllables.map((syllable, idx) => (
                    <ToneChip
                      key={`${entry.entryId}-syl-${idx}`}
                      syllable={syllable}
                      tone={entry.tonePattern[idx] ?? "M"}
                    />
                  ))}
                </div>
                {entry.example ? (
                  <p className="rounded-lg bg-surface-sunken px-3 py-2 text-xs text-text-secondary">
                    <span className="tonal-text font-medium text-text-primary">
                      {entry.example.text}
                    </span>{" "}
                    &middot; {entry.example.translation}
                  </p>
                ) : null}
              </article>
            ))}
        </div>
      </div>
    </Drawer>
  );
}
