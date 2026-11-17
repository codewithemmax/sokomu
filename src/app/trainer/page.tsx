"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TrainerGate } from "@/components/trainer/TrainerGate";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  flushTrainerSubmissionQueue,
  listTrainerSubmissions,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";

function TrainerDashboardInner({
  uid,
  role,
}: {
  uid: string;
  role: string;
}) {
  const online = useOnlineStatus();
  const [submissions, setSubmissions] = useState<TrainerSubmissionRecord[]>([]);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const all = await listTrainerSubmissions({ status: "all", online });
    setSubmissions(all);
  }, [online]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingSyncCount = submissions.filter((s) => Boolean(s.pendingSync)).length;
  const pendingReviewCount = submissions.filter(
    (s) => s.status === "pending" && s.submittedBy !== uid,
  ).length;
  const mySubmissionsCount = submissions.filter(
    (s) => s.submittedBy === uid,
  ).length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  const handleSyncQueue = async () => {
    const result = await flushTrainerSubmissionQueue({ submittedBy: uid });
    setSyncNotice(
      `Synced ${result.syncedCount} offline submission(s); ${result.remainingCount} remaining in local queue.`,
    );
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Peer Queue Waiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold text-indigo-900">
              {pendingReviewCount}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Peer entries eligible for your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Your Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold text-indigo-900">
              {mySubmissionsCount}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Role: <span className="font-mono">{role}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Approved Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold text-tone-mid">
              {approvedCount}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Published as verified glossary entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">
              Offline Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-semibold text-gold-600">
              {pendingSyncCount}
            </p>
            {pendingSyncCount > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!online}
                onClick={handleSyncQueue}
              >
                {online ? "Sync now" : "Will sync online"}
              </Button>
            ) : (
              <p className="text-xs text-text-muted">All local entries synced</p>
            )}
          </CardContent>
        </Card>
      </div>

      {syncNotice ? (
        <p role="status" className="text-xs font-medium text-tone-mid">
          {syncNotice}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Submit Dialect Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-secondary">
            <p>
              Author new headwords with full Unicode NFC tone marks, sub-dots,
              and optional on-device AI orthography verification.
            </p>
            <Link
              href="/trainer/submit"
              className="inline-flex border-2 border-indigo-900 bg-indigo-900 px-4 py-2 text-xs font-semibold text-on-indigo hover:bg-indigo-700 hover:border-indigo-700"
            >
              Open submission form &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peer Review Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-secondary">
            <p>
              Verify tone marks and meanings submitted by fellow native
              speakers before publishing to learner glossaries.
            </p>
            <Link
              href="/trainer/queue"
              className="inline-flex rounded-[10px] border border-border bg-surface-base px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-sunken"
            >
              Review pending ({pendingReviewCount}) &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entries &amp; Rule Promotion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-text-secondary">
            <p>
              Browse verified dialect lexicon alongside your submission history
              and the Remote Config rule promotion workflow.
            </p>
            <Link
              href="/trainer/entries"
              className="inline-flex rounded-[10px] border border-border bg-surface-base px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-sunken"
            >
              Browse lexicon &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TrainerHomePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
          <div>
            <h1 className="font-display text-4xl sm:text-[2.75rem] leading-[0.98] text-indigo-900">
              Native Speaker Trainer Portal
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Two-trainer verification keeps regional tonal orthography accurate
              across Yoruba, Igbo, and Hausa dialects.
            </p>
          </div>
          <Link
            href="/scenarios"
            className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
          >
            Back to learner scenarios &rarr;
          </Link>
        </div>

        <TrainerGate>
          {({ user, role }) => (
            <TrainerDashboardInner uid={user.uid} role={role} />
          )}
        </TrainerGate>
      </div>
    </AppShell>
  );
}
