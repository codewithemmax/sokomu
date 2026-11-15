"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReviewQueue } from "@/components/trainer/ReviewQueue";
import { TrainerGate } from "@/components/trainer/TrainerGate";
import { Button } from "@/components/ui/Button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { SEED_DIALECTS } from "@/lib/db/seed-catalog";
import {
  listTrainerSubmissions,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";
import type { DialectId } from "@/types/domain";

function QueueWorkspace({ uid }: { uid: string }) {
  const online = useOnlineStatus();
  const [selectedDialect, setSelectedDialect] = useState<DialectId | "all">(
    "all",
  );
  const [submissions, setSubmissions] = useState<TrainerSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listTrainerSubmissions({
        dialectId: selectedDialect === "all" ? undefined : selectedDialect,
        status: "pending",
        online,
      });
      setSubmissions(items);
    } finally {
      setLoading(false);
    }
  }, [selectedDialect, online]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="queue-dialect-filter"
            className="text-xs font-medium text-text-secondary"
          >
            Dialect filter:
          </label>
          <select
            id="queue-dialect-filter"
            value={selectedDialect}
            onChange={(event) =>
              setSelectedDialect(event.target.value as DialectId | "all")
            }
            className="rounded-[10px] border border-border bg-surface-base px-3 py-2 text-xs text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <option value="all">All dialects</option>
            {SEED_DIALECTS.map((d) => (
              <option key={d.dialectId} value={d.dialectId}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void loadQueue()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh queue"}
        </Button>
      </div>

      <ReviewQueue
        submissions={submissions}
        currentUid={uid}
        onUpdated={loadQueue}
      />
    </div>
  );
}

export default function TrainerQueuePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/trainer"
              className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
            >
              &larr; Back to Trainer Portal
            </Link>
            <h1 className="mt-1 font-display text-3xl font-semibold text-indigo-900">
              Peer Review Queue
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Approving an entry atomically publishes a verified glossary
              record; self-approval is enforced off both here and in Firestore
              rules.
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
          {({ user }) => <QueueWorkspace uid={user.uid} />}
        </TrainerGate>
      </div>
    </AppShell>
  );
}
