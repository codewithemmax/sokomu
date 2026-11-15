"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useNanoReadiness } from "@/hooks/useNanoReadiness";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getSeedDialectsByLanguage,
  SEED_LANGUAGES,
} from "@/lib/db/seed-catalog";
import { ensureAnonymousUser } from "@/lib/firebase/auth";
import {
  getLocalUserProfile,
  saveUserProfilePreferences,
} from "@/lib/progress/profile";
import type {
  DialectId,
  LanguageId,
  LearningGoal,
} from "@/types/domain";

type OnboardingStep = "language" | "dialect" | "goal" | "readiness";

const GOALS: readonly {
  id: LearningGoal;
  title: string;
  description: string;
}[] = [
  {
    id: "elder-greetings",
    title: "Greeting elders with respect",
    description:
      "Master morning and compound salutations, prostration/kneeling etiquette, and respectful titles.",
  },
  {
    id: "market",
    title: "Market day & bargaining",
    description:
      "Practise produce names (such as usu vs isu), numbers, Naira prices, and warm market banter.",
  },
  {
    id: "family",
    title: "Visiting family compounds",
    description:
      "Learn kinship terms, hospitality blessings, and household conversation across generations.",
  },
  {
    id: "transit",
    title: "Navigating transit & street life",
    description:
      "Understand bus stops, directional calls, and everyday urban cadence.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const online = useOnlineStatus();
  const { status, statusState, startDownload } = useNanoReadiness();

  const [step, setStep] = useState<OnboardingStep>("language");
  const [languageId, setLanguageId] = useState<LanguageId>("yo");
  const [dialectId, setDialectId] = useState<DialectId>("yo-ijebu");
  const [goal, setGoal] = useState<LearningGoal>("elder-greetings");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getLocalUserProfile().then((profile) => {
      if (!active) return;
      setLanguageId(profile.languageId);
      setDialectId(profile.dialectId);
      setGoal(profile.goal);
    });
    return () => {
      active = false;
    };
  }, []);

  const availableDialects = useMemo(
    () => getSeedDialectsByLanguage(languageId),
    [languageId],
  );

  const handleLanguageSelect = (nextLang: LanguageId) => {
    setLanguageId(nextLang);
    const firstDialect = getSeedDialectsByLanguage(nextLang)[0];
    if (firstDialect) {
      setDialectId(firstDialect.dialectId);
    }
    setStep("dialect");
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    try {
      let uid: string | null = null;
      let displayName: string | null = null;
      let isAnonymous = true;

      if (online) {
        try {
          const user = await ensureAnonymousUser();
          uid = user.uid;
          displayName = user.displayName;
          isAnonymous = user.isAnonymous;
        } catch {
          // Proceed with local guest profile when auth is unavailable.
        }
      }

      await saveUserProfilePreferences({
        uid,
        displayName,
        isAnonymous,
        languageId,
        dialectId,
        goal,
        nanoStatus: statusState,
      });
      router.push("/map");
    } finally {
      setSaving(false);
    }
  };

  const stepIndex =
    step === "language"
      ? 1
      : step === "dialect"
        ? 2
        : step === "goal"
          ? 3
          : 4;

  return (
    <AppShell hideNavigation>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span>Step {stepIndex} of 4</span>
            <span>Cultural Path Setup</span>
          </div>
          <ProgressBar value={stepIndex * 25} max={100} tone="gold" size="sm" />
        </div>

        {step === "language" ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="font-display text-2xl">
                  Which Nigerian language are you learning?
                </CardTitle>
                <p className="mt-1 text-sm text-text-secondary">
                  Choose a language family to explore its regional dialects and
                  tonal system.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SEED_LANGUAGES.map((lang) => {
                const isSelected = lang.languageId === languageId;
                return (
                  <button
                    key={lang.languageId}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.languageId)}
                    className={[
                      "flex flex-col items-start justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer",
                      "focus-visible:outline-2 focus-visible:outline-indigo-500",
                      isSelected
                        ? "border-indigo-700 bg-indigo-100/60"
                        : "border-border bg-surface-sunken hover:bg-indigo-100/30",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-display text-lg font-semibold text-text-primary">
                        {lang.name}
                      </p>
                      <p className="tonal-text text-sm text-indigo-700 font-medium">
                        {lang.nativeName}
                      </p>
                    </div>
                    <div className="mt-3 flex w-full items-center justify-between text-xs text-text-muted">
                      <span className="tonal-text">&ldquo;{lang.greeting}&rdquo;</span>
                      <span className="font-mono">{lang.toneSystem}</span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {step === "dialect" ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="font-display text-2xl">
                  Select your regional dialect
                </CardTitle>
                <p className="mt-1 text-sm text-text-secondary">
                  Sokomu grounds every vocabulary drill and dialogue in authentic
                  regional speech.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableDialects.map((dialect) => {
                const isSelected = dialect.dialectId === dialectId;
                return (
                  <button
                    key={dialect.dialectId}
                    type="button"
                    onClick={() => {
                      setDialectId(dialect.dialectId);
                      setStep("goal");
                    }}
                    className={[
                      "flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer",
                      "focus-visible:outline-2 focus-visible:outline-indigo-500",
                      isSelected
                        ? "border-indigo-700 bg-indigo-100/60"
                        : "border-border bg-surface-sunken hover:bg-indigo-100/30",
                    ].join(" ")}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold text-text-primary">
                          {dialect.name}
                        </span>
                        <span className="rounded-full bg-gold-100 px-2.5 py-0.5 font-mono text-xs text-gold-600">
                          {dialect.region}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary">
                        {dialect.description}
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={dialect.stampArt}
                      alt={`${dialect.name} stamp`}
                      className="size-14 shrink-0 object-contain"
                    />
                  </button>
                );
              })}
              <div className="pt-2">
                <Button variant="ghost" onClick={() => setStep("language")}>
                  &larr; Back to languages
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === "goal" ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="font-display text-2xl">
                  What is your primary cultural goal?
                </CardTitle>
                <p className="mt-1 text-sm text-text-secondary">
                  We prioritize scenarios and tonal minimal pairs that match
                  your real-world conversations.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {GOALS.map((item) => {
                const isSelected = item.id === goal;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setGoal(item.id);
                      setStep("readiness");
                    }}
                    className={[
                      "flex w-full flex-col rounded-2xl border p-4 text-left transition-all cursor-pointer",
                      "focus-visible:outline-2 focus-visible:outline-indigo-500",
                      isSelected
                        ? "border-indigo-700 bg-indigo-100/60"
                        : "border-border bg-surface-sunken hover:bg-indigo-100/30",
                    ].join(" ")}
                  >
                    <span className="font-semibold text-text-primary">
                      {item.title}
                    </span>
                    <span className="mt-1 text-xs sm:text-sm text-text-secondary">
                      {item.description}
                    </span>
                  </button>
                );
              })}
              <div className="pt-2">
                <Button variant="ghost" onClick={() => setStep("dialect")}>
                  &larr; Back to dialects
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === "readiness" ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="font-display text-2xl">
                  On-Device Hybrid AI Readiness
                </CardTitle>
                <p className="mt-1 text-sm text-text-secondary">
                  Sokomu uses Firebase AI Logic with Chrome&apos;s built-in
                  Gemini Nano when available so drills run with zero mobile data.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-border bg-surface-sunken p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    Detected Engine Status
                  </span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 font-mono text-xs font-semibold",
                      status.state === "ready"
                        ? "bg-edge-100 text-edge-600"
                        : "bg-cloud-100 text-cloud-600",
                    ].join(" ")}
                  >
                    {status.state.toUpperCase()}
                  </span>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-text-secondary">
                  {status.state === "ready"
                    ? "Gemini Nano is ready on this browser. Vocabulary and tonal drills will execute ON_DEVICE."
                    : status.state === "downloadable"
                      ? "Gemini Nano can be downloaded for offline on-device inference, or you can start immediately using cloud/cached fallback."
                      : status.state === "downloading"
                        ? `Downloading Gemini Nano (${Math.round(status.progress * 100)}%). You can continue to the map while it finishes.`
                        : "This browser does not expose window.LanguageModel yet. Sokomu will seamlessly route drills through Firebase AI Logic cloud fallback online and deterministic cached drills offline."}
                </p>

                {status.state === "downloadable" ? (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      offlineDimmed={!online}
                      onClick={() => void startDownload()}
                    >
                      Download Gemini Nano now
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep("goal")}>
                  &larr; Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  loading={saving}
                  onClick={() => void handleFinishOnboarding()}
                >
                  Enter Cultural Map &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
