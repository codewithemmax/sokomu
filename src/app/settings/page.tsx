"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SignInUpgradeModal } from "@/components/ui/SignInUpgradeModal";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { listPendingDrillResults } from "@/lib/db/drill-queue";
import { SEED_DIALECTS, SEED_LANGUAGES } from "@/lib/db/seed-catalog";
import { signOutUser } from "@/lib/firebase/auth";
import {
  getLocalUserProfile,
  saveUserProfilePreferences,
} from "@/lib/progress/profile";
import { flushDrillQueue } from "@/lib/sync/sync-engine";
import type {
  DialectId,
  LanguageId,
  LearningGoal,
  UserProfile,
} from "@/types/domain";

export default function SettingsPage() {
  const { user } = useAuthUser();
  const online = useOnlineStatus();
  const { statusState } = useNanoReadiness();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const role = profile?.role ?? "learner";
  const [languageId, setLanguageId] = useState<LanguageId>("yo");
  const [dialectId, setDialectId] = useState<DialectId>("yo-ijebu");
  const [goal, setGoal] = useState<LearningGoal>("elder-greetings");
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getLocalUserProfile(), listPendingDrillResults()]).then(
      ([storedProfile, pending]) => {
        if (!active) return;
        setProfile(storedProfile);
        setLanguageId(storedProfile.languageId);
        setDialectId(storedProfile.dialectId);
        setGoal(storedProfile.goal);
        setPendingSyncCount(pending.length);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const handleSavePreferences = async () => {
    const next = await saveUserProfilePreferences({
      uid: user?.uid ?? null,
      displayName: user?.displayName ?? profile?.displayName ?? null,
      isAnonymous: user?.isAnonymous ?? true,
      languageId,
      dialectId,
      goal,
      nanoStatus: statusState,
    });
    setProfile(next);
    setSavedNotice(true);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  const handleFlushQueue = async () => {
    await flushDrillQueue();
    const pending = await listPendingDrillResults();
    setPendingSyncCount(pending.length);
  };

  const isGuest = !user || user.isAnonymous;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-indigo-900">
              Account &amp; Learning Settings
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your dialect path, offline drill sync queue, and Firebase
              Authentication account.
            </p>
          </div>
          <Link
            href="/settings/diagnostics"
            className="text-xs sm:text-sm font-medium text-indigo-700 hover:underline"
          >
            Open AI &amp; Remote Config Diagnostics &rarr;
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Passport Account</CardTitle>
              <p className="mt-0.5 text-xs text-text-muted">
                Role: <span className="font-mono uppercase">{role}</span>{" "}
                &middot; UID:{" "}
                <code className="font-mono">{user?.uid ?? "local-guest"}</code>
              </p>
            </div>
            <span
              className={[
                "rounded-full px-3 py-1 font-mono text-xs font-semibold",
                isGuest
                  ? "bg-surface-sunken text-text-secondary"
                  : "bg-edge-100 text-edge-600",
              ].join(" ")}
            >
              {isGuest ? "Anonymous Guest" : (user?.email ?? "Google Linked")}
            </span>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {isGuest
                ? "Upgrade with Google to sync your stamps across devices and unlock Native Speaker Trainer access."
                : `Signed in as ${user?.displayName ?? user?.email ?? "verified user"}.`}
            </p>
            {isGuest ? (
              <Button
                variant="primary"
                offlineDimmed={!online}
                onClick={() => setUpgradeModalOpen(true)}
              >
                Sign in with Google
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void signOutUser()}
              >
                Sign out
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cultural Learning Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="settings-language"
                  className="block text-xs font-semibold text-text-secondary"
                >
                  Language
                </label>
                <select
                  id="settings-language"
                  value={languageId}
                  onChange={(e) => setLanguageId(e.target.value as LanguageId)}
                  className="mt-1 h-11 w-full rounded-[10px] border border-border bg-surface-sunken px-3 text-sm text-text-primary"
                >
                  {SEED_LANGUAGES.map((l) => (
                    <option key={l.languageId} value={l.languageId}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="settings-dialect"
                  className="block text-xs font-semibold text-text-secondary"
                >
                  Regional Dialect
                </label>
                <select
                  id="settings-dialect"
                  value={dialectId}
                  onChange={(e) => setDialectId(e.target.value as DialectId)}
                  className="mt-1 h-11 w-full rounded-[10px] border border-border bg-surface-sunken px-3 text-sm text-text-primary"
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
                  htmlFor="settings-goal"
                  className="block text-xs font-semibold text-text-secondary"
                >
                  Learning Goal
                </label>
                <select
                  id="settings-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as LearningGoal)}
                  className="mt-1 h-11 w-full rounded-[10px] border border-border bg-surface-sunken px-3 text-sm text-text-primary"
                >
                  <option value="elder-greetings">Elder greetings</option>
                  <option value="market">Market bargaining</option>
                  <option value="family">Visiting family</option>
                  <option value="transit">Transit &amp; street life</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="primary"
                onClick={() => void handleSavePreferences()}
              >
                Save preferences
              </Button>
              {savedNotice ? (
                <span className="font-mono text-xs text-edge-600">
                  Preferences saved locally and queued for sync.
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Sync Queue</CardTitle>
            <span className="font-mono text-xs text-text-muted">
              {pendingSyncCount} pending item{pendingSyncCount === 1 ? "" : "s"}
            </span>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
            <p>
              Drill results completed in Airplane Mode are stored in IndexedDB{" "}
              <code className="font-mono text-xs">drillQueue</code> and flushed
              idempotently on reconnect.
            </p>
            <Button
              size="sm"
              variant="secondary"
              offlineDimmed={!online}
              onClick={() => void handleFlushQueue()}
            >
              Sync now
            </Button>
          </CardContent>
        </Card>
      </div>

      <SignInUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </AppShell>
  );
}
