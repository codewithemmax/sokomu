"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRemoteConfigBoolean } from "@/hooks/useRemoteConfigValue";
import {
  synthesizeOrReplayScenarioAudio,
  TtsSynthesisError,
} from "@/lib/ai/tts";
import {
  estimatePcmDurationMs,
  pcm16LeToFloat32,
  PcmStreamPlayer,
} from "@/lib/audio/pcm-player";
import { getCachedAudioForScenario } from "@/lib/db/audio-cache";
import type { Scenario } from "@/types/domain";

export type AudioCacheState = "none" | "streaming" | "cached";

export interface DualSpeakerPlayerProps {
  scenario: Scenario;
  onActiveLineChange?: (lineIndex: number) => void;
}

export function computePcmPeaks(
  pcmBytes: Uint8Array,
  barCount = 48,
): number[] {
  const safeBars = Math.max(8, barCount);
  const { samples } = pcm16LeToFloat32(pcmBytes);
  if (samples.length === 0) {
    return Array.from({ length: safeBars }, (_, idx) =>
      Number((0.18 + ((idx * 7) % 13) * 0.04).toFixed(2)),
    );
  }

  const windowSize = Math.max(1, Math.floor(samples.length / safeBars));
  const peaks: number[] = [];
  for (let i = 0; i < safeBars; i += 1) {
    const start = i * windowSize;
    const end = Math.min(samples.length, start + windowSize);
    let maxAmp = 0;
    for (let j = start; j < end; j += 1) {
      const abs = Math.abs(samples[j] ?? 0);
      if (abs > maxAmp) {
        maxAmp = abs;
      }
    }
    peaks.push(Number(Math.min(1, Math.max(0.12, maxAmp * 1.4)).toFixed(2)));
  }
  return peaks;
}

function formatDurationClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function DualSpeakerPlayer({
  scenario,
  onActiveLineChange,
}: DualSpeakerPlayerProps) {
  const online = useOnlineStatus();
  const ttsEnabled = useRemoteConfigBoolean("tts_enabled");

  const [cacheState, setCacheState] = useState<AudioCacheState>("none");
  const [cachedBytes, setCachedBytes] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(
    estimatePcmDurationMs(scenario.estimatedAudioBytes),
  );
  const [peaks, setPeaks] = useState<number[]>(() =>
    computePcmPeaks(new Uint8Array(0), 48),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playerRef = useRef<PcmStreamPlayer | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void getCachedAudioForScenario(scenario.scenarioId).then((record) => {
      if (!active || !record) return;
      setCacheState("cached");
      setCachedBytes(record.bytes);
      setDurationMs(record.durationMs);
      setPeaks(computePcmPeaks(new Uint8Array(record.pcm), 48));
    });
    return () => {
      active = false;
      if (timerRef.current !== null && typeof window !== "undefined") {
        window.clearInterval(timerRef.current);
      }
      void playerRef.current?.close();
    };
  }, [scenario.scenarioId]);

  const speakerA = scenario.speakers[0];
  const speakerB = scenario.speakers[1];

  const lineTimings = useMemo(() => {
    const totalChars = Math.max(
      1,
      scenario.script.reduce((acc, l) => acc + l.text.length, 0),
    );
    let cursor = 0;
    return scenario.script.map((line, index) => {
      const share = line.text.length / totalChars;
      const startRatio = cursor;
      const endRatio = cursor + share;
      cursor = endRatio;
      return {
        index,
        speakerId: line.speakerId,
        startRatio,
        endRatio,
      };
    });
  }, [scenario.script]);

  const progressRatio =
    durationMs > 0 ? Math.min(1, Math.max(0, elapsedMs / durationMs)) : 0;

  const activeSpeakerId = useMemo(() => {
    const found = lineTimings.find(
      (t) => progressRatio >= t.startRatio && progressRatio <= t.endRatio,
    );
    return found?.speakerId ?? speakerA.id;
  }, [lineTimings, progressRatio, speakerA.id]);

  useEffect(() => {
    if (!playing || !onActiveLineChange) return;
    const found = lineTimings.find(
      (t) => progressRatio >= t.startRatio && progressRatio <= t.endRatio,
    );
    if (found) {
      onActiveLineChange(found.index);
    }
  }, [playing, progressRatio, lineTimings, onActiveLineChange]);

  const handleStop = () => {
    playerRef.current?.stop();
    setPlaying(false);
    if (timerRef.current !== null && typeof window !== "undefined") {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePlayOrSynthesize = async () => {
    if (playing) {
      handleStop();
      return;
    }

    setErrorMessage(null);
    const isAlreadyCached = cacheState === "cached";
    if (!isAlreadyCached) {
      setCacheState("streaming");
    }

    try {
      playerRef.current ??= new PcmStreamPlayer();
      const player = playerRef.current;
      player.stop();

      setPlaying(true);
      setElapsedMs(0);

      const startedAt = Date.now();
      if (typeof window !== "undefined") {
        timerRef.current = window.setInterval(() => {
          setElapsedMs(Date.now() - startedAt);
        }, 120);
      }

      const streamedChunks: Uint8Array[] = [];
      const result = await synthesizeOrReplayScenarioAudio(scenario, {
        onChunk: (chunk) => {
          streamedChunks.push(chunk);
          player.enqueue(chunk);
          const combinedLen = streamedChunks.reduce(
            (sum, item) => sum + item.byteLength,
            0,
          );
          const combined = new Uint8Array(combinedLen);
          let offset = 0;
          for (const part of streamedChunks) {
            combined.set(part, offset);
            offset += part.byteLength;
          }
          setPeaks(computePcmPeaks(combined, 48));
        },
      });

      setCacheState("cached");
      setCachedBytes(result.record.bytes);
      setDurationMs(result.record.durationMs);

      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          handleStop();
        }, Math.max(400, result.record.durationMs));
      }
    } catch (err: unknown) {
      handleStop();
      setCacheState(isAlreadyCached ? "cached" : "none");
      if (err instanceof TtsSynthesisError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not synthesize dialogue audio.",
        );
      }
    }
  };

  const cachedMbLabel =
    cachedBytes > 0
      ? `${(cachedBytes / 1_048_576).toFixed(2)} MB`
      : `${(scenario.estimatedAudioBytes / 1_048_576).toFixed(1)} MB est.`;

  const isCloudBlockedOffline = !online && cacheState !== "cached";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
            24 kHz Dual-Speaker PCM Player
          </p>
          <p className="text-xs text-text-secondary">
            {speakerA.displayName} ({speakerA.role}) &amp;{" "}
            {speakerB.displayName} ({speakerB.role})
          </p>
        </div>

        {cacheState === "cached" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/30 bg-gold-100 px-3 py-1 font-mono text-xs font-semibold text-gold-600">
            <span>Saved offline &middot; {cachedMbLabel}</span>
          </span>
        ) : cacheState === "streaming" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cloud-600/30 bg-cloud-100 px-3 py-1 font-mono text-xs font-semibold text-cloud-600">
            <span className="inline-block size-2 rounded-full bg-cloud-600 animate-ping" />
            <span>IN_CLOUD &middot; streaming</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-sunken px-3 py-1 font-mono text-xs text-text-muted">
            Not saved ({cachedMbLabel})
          </span>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-surface-sunken p-3">
        {[speakerA, speakerB].map((speaker, laneIdx) => {
          const isLaneActive = !playing || activeSpeakerId === speaker.id;
          const barColor =
            laneIdx === 0 ? "bg-gold-600" : "bg-indigo-500";
          return (
            <div
              key={speaker.id}
              className={[
                "flex h-10 items-center gap-3 transition-opacity duration-200",
                isLaneActive ? "opacity-100" : "opacity-35",
              ].join(" ")}
            >
              <span className="w-20 sm:w-28 shrink-0 truncate text-xs font-semibold text-text-primary">
                {speaker.displayName}
              </span>
              <div
                aria-hidden="true"
                className="flex min-w-0 flex-1 items-center gap-px sm:gap-[2px] h-8 overflow-hidden"
              >
                {peaks.map((amp, barIdx) => {
                  const barRatio = barIdx / peaks.length;
                  const isPlayed = playing && barRatio <= progressRatio;
                  const heightPct = Math.round(
                    Math.min(100, Math.max(16, amp * 100)),
                  );
                  return (
                    <span
                      key={`${speaker.id}-${barIdx}`}
                      style={{ height: `${heightPct}%` }}
                      className={[
                        "min-w-[1px] flex-1 rounded-full transition-all duration-150",
                        barColor,
                        isPlayed ? "opacity-100" : "opacity-55",
                      ].join(" ")}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {ttsEnabled || cacheState === "cached" ? (
            <Button
              variant={cacheState === "cached" ? "gold" : "primary"}
              offlineDimmed={isCloudBlockedOffline}
              loading={cacheState === "streaming"}
              onClick={() => void handlePlayOrSynthesize()}
            >
              {playing
                ? "Stop"
                : cacheState === "cached"
                  ? "Play cached dialogue"
                  : "Stream & save for offline"}
            </Button>
          ) : (
            <span className="text-xs text-text-muted">
              Cloud synthesis disabled by Remote Config.
            </span>
          )}

          <span className="font-mono text-xs tabular-nums text-text-secondary">
            {formatDurationClock(elapsedMs)} / {formatDurationClock(durationMs)}
          </span>
        </div>

        {isCloudBlockedOffline ? (
          <p className="text-xs font-medium text-offline-600">
            Audio not cached yet. Connect once to save it; vocabulary and tone
            drills work offline right now.
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-danger-600/30 bg-surface-sunken px-3.5 py-2.5 text-xs text-danger-600"
        >
          <span>{errorMessage}</span>
          <Button
            size="sm"
            variant="secondary"
            offlineDimmed={isCloudBlockedOffline}
            onClick={() => void handlePlayOrSynthesize()}
          >
            Retry
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
