"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ToneChip } from "@/components/drill/ToneChip";
import { AppShell } from "@/components/layout/AppShell";
import { DictionaryDrawer } from "@/components/trainer/DictionaryDrawer";
import { TrainerGate } from "@/components/trainer/TrainerGate";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { loadGlossaryForDialect } from "@/lib/db/glossary-cache";
import { getSeedDialect, SEED_DIALECTS } from "@/lib/db/seed-catalog";
import {
  listTrainerSubmissions,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";
import type { DialectId, GlossaryEntry } from "@/types/domain";

function EntriesWorkspace({ uid }: { uid: string }) {
  const online = useOnlineStatus();
  const [dialectId, setDialectId] = useState<DialectId>("yo-ijebu");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [submissions, setSubmissions] = useState<TrainerSubmissionRecord[]>([]);

  const loadData = useCallback(async () => {
    const [entries, subs] = await Promise.all([
      loadGlossaryForDialect(dialectId),
      listTrainerSubmissions({ dialectId, status: "all", online }),
    ]);
    setGlossary(entries);
    setSubmissions(subs);
  }, [dialectId, online]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const dialect = getSeedDialect(dialectId);
  const approvedTrainerEntries = glossary.filter((e) => e.source === "trainer");
  const mySubmissions = submissions.filter((s) => s.submittedBy === uid);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="entries-dialect"
            className="text-xs font-medium text-text-secondary"
          >
            Dialect:
          </label>
          <select
            id="entries-dialect"
            value={dialectId}
            onChange={(event) => setDialectId(event.target.value as DialectId)}
            className="rounded-[10px] border border-border bg-surface-base px-3 py-2 text-xs text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {SEED_DIALECTS.map((d) => (
              <option key={d.dialectId} value={d.dialectId}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDrawerOpen(true)}
        >
          Open {dialect?.name ?? dialectId} DictionaryDrawer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Verified Trainer Glossary Entries ({approvedTrainerEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvedTrainerEntries.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No peer-approved trainer entries for {dialect?.name ?? dialectId}{" "}
              yet. Currently showing {glossary.length} verified seed entries in{" "}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="font-medium text-indigo-700 underline"
              >
                DictionaryDrawer
              </button>
              .
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {approvedTrainerEntries.map((entry) => (
                <div
                  key={entry.entryId}
                  className="rounded-xl border border-border bg-surface-sunken p-3.5 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="tonal-text text-lg font-semibold text-indigo-900">
                      {entry.headword}
                    </span>
                    <span className="rounded-full bg-edge-100 px-2 py-0.5 font-mono text-[11px] text-edge-600">
                      Verified (trainer)
                    </span>
                  </div>
                  <p className="text-xs text-text-primary">{entry.glossEn}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.syllables.map((syl, idx) => (
                      <ToneChip
                        key={`${entry.entryId}-t-${idx}`}
                        syllable={syl}
                        tone={entry.tonePattern[idx] ?? "M"}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Submissions in {dialect?.name ?? dialectId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mySubmissions.length === 0 ? (
            <p className="text-sm text-text-secondary">
              You have not submitted entries for this dialect yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.submissionId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-sunken p-3"
                >
                  <div>
                    <p className="tonal-text text-base font-semibold text-indigo-900">
                      {sub.headword}
                    </p>
                    <p className="text-xs text-text-secondary">{sub.glossEn}</p>
                    {sub.rejectionReason ? (
                      <p className="mt-1 text-xs text-danger-600">
                        Reviewer feedback: {sub.rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {sub.pendingSync ? (
                      <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 font-mono text-[11px] text-text-muted">
                        Will sync
                      </span>
                    ) : null}
                    <span
                      className={[
                        "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase",
                        sub.status === "approved"
                          ? "bg-edge-100 text-edge-600"
                          : sub.status === "rejected"
                            ? "bg-danger-100 text-danger-600"
                            : "bg-gold-100 text-offline-600",
                      ].join(" ")}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promoting Dialect Rules to Firebase Remote Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text-secondary">
          <p>
            Individual vocabulary entries go live immediately after peer
            approval. Grammatical or phonological dialect rules validated across
            multiple submissions are promoted by the Lead Architect into{" "}
            <code className="font-mono">dialect_rules_json</code> in Firebase
            Remote Config so Gemini Nano and Cloud prompts enforce them without a
            client redeploy.
          </p>
          <p className="font-mono text-xs text-text-muted">
            Runbook: docs/remote-config-dialect-promotion.md
          </p>
        </CardContent>
      </Card>

      <DictionaryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        dialectId={dialectId}
      />
    </div>
  );
}

export default function TrainerEntriesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/trainer"
              className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
            >
              &larr; Back to Trainer Portal
            </Link>
            <h1 className="mt-1 font-display text-3xl font-semibold text-indigo-900">
              Trainer Lexicon &amp; Rule Promotion
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Inspect verified glossary entries, pending submissions, and the
              Remote Config promotion guide.
            </p>
          </div>
          <Link
            href="/trainer/submit"
            className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
          >
            + Submit new entry &rarr;
          </Link>
        </div>

        <TrainerGate>
          {({ user }) => <EntriesWorkspace uid={user.uid} />}
        </TrainerGate>
      </div>
    </AppShell>
  );
}
