"use client";

import { useState } from "react";
import { ToneChip } from "@/components/drill/ToneChip";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getSeedDialect } from "@/lib/db/seed-catalog";
import {
  approveSubmission,
  rejectSubmission,
  type TrainerSubmissionRecord,
} from "@/lib/trainer/submissions";

export interface ReviewQueueProps {
  submissions: readonly TrainerSubmissionRecord[];
  currentUid: string;
  onUpdated: () => Promise<void> | void;
}

export function ReviewQueue({
  submissions,
  currentUid,
  onUpdated,
}: ReviewQueueProps) {
  const online = useOnlineStatus();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const handleApprove = async (submission: TrainerSubmissionRecord) => {
    setFeedback(null);
    setBusyId(submission.submissionId);
    try {
      const createdEntry = await approveSubmission({
        submission,
        reviewerUid: currentUid,
      });
      setFeedback({
        type: "ok",
        text: `Approved "${createdEntry.headword}" and published verified glossary entry ${createdEntry.entryId}.`,
      });
      await onUpdated();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not approve submission.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (submission: TrainerSubmissionRecord) => {
    setFeedback(null);
    setBusyId(submission.submissionId);
    try {
      await rejectSubmission({
        submission,
        reviewerUid: currentUid,
        reason: rejectionReason,
      });
      setRejectingId(null);
      setRejectionReason("");
      setFeedback({
        type: "ok",
        text: `Returned "${submission.headword}" with peer review feedback.`,
      });
      await onUpdated();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not reject submission.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={[
            "rounded-xl border p-3.5 text-sm",
            feedback.type === "error"
              ? "border-danger-600/40 bg-danger-100 text-danger-600"
              : "border-edge-600/30 bg-edge-100 text-edge-600",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      ) : null}

      {!online ? (
        <div className="rounded-xl border border-gold-400/60 bg-gold-100 p-3.5 text-xs text-offline-600">
          Peer review approvals and rejections require an active network
          connection so verified entries write atomically to Firestore.
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-text-secondary">
            No pending trainer submissions match the active dialect filter.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {submissions.map((sub) => {
          const isSelf = sub.submittedBy === currentUid;
          const isBusy = busyId === sub.submissionId;
          const isRejectOpen = rejectingId === sub.submissionId;
          const dialect = getSeedDialect(sub.dialectId);

          return (
            <Card key={sub.submissionId}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="tonal-text text-2xl text-indigo-900">
                      {sub.headword}
                    </CardTitle>
                    <p className="mt-1 text-sm text-text-primary">
                      {sub.glossEn}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-sm bg-indigo-100/70 px-2.5 py-0.5 font-mono text-[11px] font-medium text-indigo-700">
                      {dialect?.name ?? sub.dialectId}
                    </span>
                    <span
                      className={[
                        "rounded-sm px-2.5 py-0.5 font-mono text-[11px] font-medium",
                        isSelf
                          ? "bg-gold-100 text-offline-600"
                          : "bg-edge-100 text-edge-600",
                      ].join(" ")}
                    >
                      {isSelf
                        ? "Your submission (awaiting peer)"
                        : "Ready for peer review"}
                    </span>
                    {sub.pendingSync ? (
                      <span className="rounded-sm border border-border bg-surface-sunken px-2.5 py-0.5 font-mono text-[11px] text-text-muted">
                        Will sync
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {sub.standardForm ? (
                  <p className="text-xs text-text-secondary">
                    Standard equivalent:{" "}
                    <span className="tonal-text font-medium text-text-primary">
                      {sub.standardForm}
                    </span>
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-1.5">
                  {sub.syllables.map((syl, idx) => (
                    <ToneChip
                      key={`${sub.submissionId}-q-syl-${idx}`}
                      syllable={syl}
                      tone={sub.tonePattern[idx] ?? "M"}
                    />
                  ))}
                </div>

                {sub.example ? (
                  <p className="rounded-xl bg-surface-sunken px-3.5 py-2.5 text-xs text-text-secondary">
                    <span className="tonal-text font-medium text-text-primary">
                      {sub.example.text}
                    </span>{" "}
                    &middot; {sub.example.translation}
                  </p>
                ) : null}

                {sub.note ? (
                  <p className="text-xs text-text-muted">
                    Trainer note: {sub.note}
                  </p>
                ) : null}

                {isRejectOpen && !isSelf ? (
                  <div className="space-y-2 rounded-xl border border-danger-600/30 bg-surface-sunken p-3">
                    <label
                      htmlFor={`reject-reason-${sub.submissionId}`}
                      className="block text-xs font-medium text-text-primary"
                    >
                      Reason for rejection (visible to submitter)
                    </label>
                    <textarea
                      id={`reject-reason-${sub.submissionId}`}
                      rows={2}
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Specify tone mark, sub-dot, or regional lexical correction needed"
                      className="w-full rounded-[10px] border border-border bg-surface-base px-3 py-2 text-xs text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={!online || isBusy || !rejectionReason.trim()}
                        onClick={() => handleConfirmReject(sub)}
                      >
                        {isBusy ? "Sending..." : "Confirm rejection"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>

              <CardFooter className="justify-between gap-3">
                <span className="font-mono text-[11px] text-text-muted">
                  ID: {sub.submissionId}
                </span>

                {isSelf ? (
                  <p className="text-xs font-medium text-gold-600">
                    Self-approval blocked: a second verified trainer must review
                    this entry.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!online || isBusy || Boolean(sub.pendingSync)}
                      onClick={() => {
                        setRejectingId(
                          isRejectOpen ? null : sub.submissionId,
                        );
                        setRejectionReason("");
                      }}
                    >
                      Request changes
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={!online || isBusy || Boolean(sub.pendingSync)}
                      onClick={() => handleApprove(sub)}
                    >
                      {isBusy ? "Publishing..." : "Approve & publish"}
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
