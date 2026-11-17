"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  clearAllAudioCache,
  deleteCachedAudioByScenario,
  listCachedAudio,
} from "@/lib/db/audio-cache";
import {
  estimateStorageUsage,
  requestPersistentStorage,
  type AudioCacheRecord,
  type StorageEstimateInfo,
} from "@/lib/db/idb";
import { getSeedDialect, getSeedScenario } from "@/lib/db/seed-catalog";

export function formatStorageBytes(bytes: number): string {
  const safe = Math.max(0, bytes);
  if (safe < 1024) {
    return `${safe} B`;
  }
  if (safe < 1_048_576) {
    return `${(safe / 1024).toFixed(1)} KB`;
  }
  return `${(safe / 1_048_576).toFixed(2)} MB`;
}

export default function OfflineLibraryPage() {
  const [records, setRecords] = useState<AudioCacheRecord[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo>({
    usageBytes: 0,
    quotaBytes: 0,
    persisted: false,
  });
  const [loading, setLoading] = useState(true);

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const [cachedList, estimate] = await Promise.all([
        listCachedAudio(),
        estimateStorageUsage(),
      ]);
      setRecords(cachedList);
      setStorageInfo(estimate);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  const handleRequestPersist = async () => {
    await requestPersistentStorage();
    await refreshLibrary();
  };

  const handleDeleteScenarioCache = async (scenarioId: string) => {
    await deleteCachedAudioByScenario(scenarioId);
    await refreshLibrary();
  };

  const handleClearAll = async () => {
    await clearAllAudioCache();
    await refreshLibrary();
  };

  const totalCachedPcmBytes = records.reduce((sum, r) => sum + r.bytes, 0);
  const quotaPct =
    storageInfo.quotaBytes > 0
      ? Math.min(
          100,
          Math.max(
            1,
            Math.round((storageInfo.usageBytes / storageInfo.quotaBytes) * 100),
          ),
        )
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-5">
          <div>
            <h1 className="font-display text-4xl sm:text-[2.75rem] leading-[0.98] text-indigo-900">
              Offline Audio &amp; Scenario Library
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Synthesized 24 kHz mono PCM dialogues stored in IndexedDB for
              zero-network Airplane Mode replay.
            </p>
          </div>
          {records.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleClearAll()}
            >
              Clear audio cache
            </Button>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Device Storage Meter</CardTitle>
              <p className="mt-0.5 text-xs text-text-muted">
                IndexedDB database: <code className="font-mono">sokomu</code>{" "}
                (v1)
              </p>
            </div>
            <span
              className={[
                "rounded-sm px-3 py-1 font-mono text-xs font-semibold",
                storageInfo.persisted
                  ? "bg-edge-100 text-edge-600"
                  : "bg-gold-100 text-gold-600",
              ].join(" ")}
            >
              {storageInfo.persisted
                ? "Persistent storage active"
                : "Best-effort storage"}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-surface-sunken p-3">
                <p className="text-xs text-text-muted">Cached PCM Audio</p>
                <p className="mt-1 font-mono text-lg font-semibold text-gold-600">
                  {formatStorageBytes(totalCachedPcmBytes)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-sunken p-3">
                <p className="text-xs text-text-muted">Origin Usage</p>
                <p className="mt-1 font-mono text-lg font-semibold text-text-primary">
                  {formatStorageBytes(storageInfo.usageBytes)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-sunken p-3">
                <p className="text-xs text-text-muted">Saved Dialogues</p>
                <p className="mt-1 font-mono text-lg font-semibold text-indigo-700">
                  {records.length}
                </p>
              </div>
            </div>

            {storageInfo.quotaBytes > 0 ? (
              <ProgressBar
                label={`Browser storage quota used (${formatStorageBytes(storageInfo.usageBytes)} of ${formatStorageBytes(storageInfo.quotaBytes)})`}
                value={quotaPct}
                showValueLabel
                tone="gold"
                size="sm"
              />
            ) : null}

            {!storageInfo.persisted ? (
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void handleRequestPersist()}
                >
                  Request persistent offline storage
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {loading ? (
          <Card className="p-8 text-center text-sm text-text-muted">
            Loading cached audio records...
          </Card>
        ) : records.length === 0 ? (
          <Card className="space-y-3 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              No dialogues saved for offline replay yet
            </h2>
            <p className="mx-auto max-w-md text-sm text-text-secondary">
              Open any cultural scenario while online and tap{" "}
              <strong>Stream &amp; save for offline</strong> to synthesize and
              cache its 24 kHz two-speaker dialogue.
            </p>
            <div className="pt-2">
              <Link
                href="/scenarios"
                className="inline-flex min-h-[44px] items-center justify-center border-2 border-indigo-900 bg-indigo-900 px-5 py-2.5 text-sm font-semibold text-on-indigo hover:bg-indigo-700 hover:border-indigo-700"
              >
                Browse scenarios &rarr;
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {records.map((record) => {
              const scenario = getSeedScenario(record.scenarioId);
              const dialect = scenario
                ? getSeedDialect(scenario.dialectId)
                : undefined;
              const durationSec = Math.round(record.durationMs / 1000);

              return (
                <Card key={record.key} className="flex flex-col justify-between">
                  <div>
                    <CardHeader>
                      <div>
                        <span className="font-mono text-xs font-semibold text-gold-600">
                          {dialect?.name ?? record.scenarioId}
                        </span>
                        <CardTitle className="mt-0.5 font-display text-xl">
                          {scenario?.title ?? record.scenarioId}
                        </CardTitle>
                      </div>
                      <span className="rounded-sm bg-gold-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-gold-600">
                        {formatStorageBytes(record.bytes)}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs text-text-secondary">
                      <p>
                        Duration: <strong className="font-mono">{durationSec}s</strong>{" "}
                        &middot; {record.sampleRate} Hz mono PCM
                      </p>
                      <p className="font-mono text-[11px] text-text-muted">
                        Model: {record.ttsModel} &middot; Hash:{" "}
                        {record.promptHash}
                      </p>
                    </CardContent>
                  </div>
                  <CardFooter>
                    <Link
                      href={`/scenarios/${record.scenarioId}?tab=listen`}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] bg-gold-600 px-4 py-2 text-xs font-medium text-white hover:bg-gold-600/90"
                    >
                      Replay offline
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void handleDeleteScenarioCache(record.scenarioId)
                      }
                    >
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
