"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignInUpgradeModal } from "@/components/ui/SignInUpgradeModal";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRemoteConfigBoolean } from "@/hooks/useRemoteConfigValue";
import { SEED_DIALECTS } from "@/lib/db/seed-catalog";
import {
  flushTrainerSubmissionQueue,
  getMyTrainerRequest,
  submitTrainerAccessRequest,
} from "@/lib/trainer/submissions";
import type { DialectId, TrainerRequest, UserRole } from "@/types/domain";

export interface TrainerGateContext {
  user: User;
  role: UserRole;
}

export interface TrainerGateProps {
  children: (ctx: TrainerGateContext) => ReactNode;
}

export function TrainerGate({ children }: TrainerGateProps) {
  const portalEnabled = useRemoteConfigBoolean("feature_trainer_portal");
  const { user, loading, isAnonymous, role, roleLoading } = useAuthUser();
  const online = useOnlineStatus();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [existingRequest, setExistingRequest] = useState<TrainerRequest | null>(
    null,
  );
  const [requestDialectId, setRequestDialectId] =
    useState<DialectId>("yo-ijebu");
  const [motivation, setMotivation] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSavedNotice, setRequestSavedNotice] = useState<string | null>(
    null,
  );
  const [requestBusy, setRequestBusy] = useState(false);

  const isPrivileged = role === "trainer" || role === "admin";
  const isSignedIn = Boolean(user) && !isAnonymous;

  useEffect(() => {
    if (!user?.uid || isAnonymous || isPrivileged) {
      return;
    }
    let active = true;
    void getMyTrainerRequest(user.uid).then((req) => {
      if (active) setExistingRequest(req);
    });
    return () => {
      active = false;
    };
  }, [user?.uid, isAnonymous, isPrivileged]);

  useEffect(() => {
    if (!online || !user?.uid || isAnonymous || !isPrivileged) {
      return;
    }
    void flushTrainerSubmissionQueue({ submittedBy: user.uid });
  }, [online, user?.uid, isAnonymous, isPrivileged]);

  if (!portalEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trainer Portal Disabled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text-secondary">
          <p>
            The Native Speaker Trainer Portal is currently toggled off via
            Firebase Remote Config (<code className="font-mono">feature_trainer_portal</code>).
          </p>
          <Link
            href="/map"
            className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
          >
            &larr; Return to Nigeria dialect map
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (loading || roleLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-text-muted" role="status">
          Verifying account session and trainer permissions...
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign in required for Native Trainer Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Community dialect submissions require a Google account so verified
            entries carry clear peer-review attribution and never allow self-approval.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setUpgradeOpen(true)}>
              Sign in with Google
            </Button>
            <Link
              href="/scenarios"
              className="inline-flex min-h-10 items-center text-xs font-medium text-indigo-700 hover:underline"
            >
              Continue learning as guest &rarr;
            </Link>
          </div>
          <SignInUpgradeModal
            open={upgradeOpen}
            onClose={() => setUpgradeOpen(false)}
          />
        </CardContent>
      </Card>
    );
  }

  if (!isPrivileged) {
    const handleRequestAccess = async (
      event: React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();
      setRequestError(null);
      setRequestSavedNotice(null);
      setRequestBusy(true);
      try {
        const result = await submitTrainerAccessRequest({
          uid: user.uid,
          dialectId: requestDialectId,
          motivation,
          online,
        });
        setExistingRequest(result.request);
        setMotivation("");
        setRequestSavedNotice(
          result.synced
            ? "Request submitted to admins for review."
            : "Request saved locally and will sync when you are back online.",
        );
      } catch (err: unknown) {
        setRequestError(
          err instanceof Error
            ? err.message
            : "Could not submit trainer access request.",
        );
      } finally {
        setRequestBusy(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Request Native Trainer Role</CardTitle>
              <span className="rounded-full bg-surface-sunken px-3 py-1 font-mono text-xs text-text-secondary">
                Current role: {role}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Verified trainers can submit new regional dialect words, adjust
              syllable tone patterns, and peer-review submissions from other
              community contributors.
            </p>

            {existingRequest ? (
              <div
                className="rounded-xl border border-gold-400/60 bg-gold-100 p-4 space-y-1.5 text-sm text-offline-600"
                role="status"
              >
                <p className="font-semibold">
                  Trainer access request on file ({existingRequest.dialectId})
                </p>
                <p className="text-xs">{existingRequest.motivation}</p>
                <p className="font-mono text-[11px]">
                  Once an admin grants role &quot;trainer&quot; on{" "}
                  <code>users/{user.uid}</code>, this portal unlocks automatically.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div>
                <label
                  htmlFor="request-dialect"
                  className="mb-1.5 block text-xs font-medium text-text-secondary"
                >
                  Primary dialect you speak natively
                </label>
                <select
                  id="request-dialect"
                  value={requestDialectId}
                  onChange={(event) =>
                    setRequestDialectId(event.target.value as DialectId)
                  }
                  className="w-full rounded-[10px] border border-border bg-surface-base px-3 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  {SEED_DIALECTS.map((dialect) => (
                    <option key={dialect.dialectId} value={dialect.dialectId}>
                      {dialect.name} ({dialect.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="request-motivation"
                  className="mb-1.5 block text-xs font-medium text-text-secondary"
                >
                  Fluency background and dialect notes
                </label>
                <textarea
                  id="request-motivation"
                  rows={3}
                  value={motivation}
                  onChange={(event) => setMotivation(event.target.value)}
                  placeholder="Describe your native dialect background (e.g. born and raised in Ijebu-Ode, familiar with tonal orthography)"
                  className="w-full rounded-[10px] border border-border bg-surface-base px-3.5 py-2.5 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-indigo-500"
                />
              </div>

              {requestError ? (
                <p role="alert" className="text-xs font-medium text-danger-600">
                  {requestError}
                </p>
              ) : null}
              {requestSavedNotice ? (
                <p role="status" className="text-xs font-medium text-edge-600">
                  {requestSavedNotice}
                </p>
              ) : null}

              <Button type="submit" disabled={requestBusy}>
                {requestBusy
                  ? "Sending..."
                  : existingRequest
                    ? "Update trainer request"
                    : "Request trainer access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children({ user, role })}</>;
}
