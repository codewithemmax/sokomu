"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EntryForm } from "@/components/trainer/EntryForm";
import { TrainerGate } from "@/components/trainer/TrainerGate";
import { isDialectId } from "@/types/guards";

function TrainerSubmitContent() {
  const searchParams = useSearchParams();
  const rawDialect = searchParams?.get("dialectId") ?? "";
  const rawScenario = searchParams?.get("scenarioId") ?? "";
  const initialDialectId = isDialectId(rawDialect) ? rawDialect : "yo-ijebu";

  return (
    <TrainerGate>
      {({ user }) => (
        <EntryForm
          uid={user.uid}
          initialDialectId={initialDialectId}
          initialScenarioId={rawScenario}
        />
      )}
    </TrainerGate>
  );
}

export default function TrainerSubmitPage() {
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
            <h1 className="mt-1 font-display text-4xl sm:text-[2.75rem] leading-[0.98] text-indigo-900">
              Submit Regional Dialect Entry
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Submissions normalize to Unicode NFC and queue offline if your
              connection drops.
            </p>
          </div>
          <Link
            href="/trainer/queue"
            className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
          >
            Open peer review queue &rarr;
          </Link>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-text-muted">Loading entry form...</p>
          }
        >
          <TrainerSubmitContent />
        </Suspense>
      </div>
    </AppShell>
  );
}
