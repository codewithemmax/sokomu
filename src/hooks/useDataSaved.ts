"use client";

import { useMemo } from "react";
import { REMOTE_CONFIG_DEFAULTS } from "@/lib/firebase/remote-config-defaults";
import { useInferenceTelemetry } from "./useInferenceTelemetry";
import { useRemoteConfigNumber } from "./useRemoteConfigValue";

export interface DataSavedMetrics {
  bytesSaved: number;
  kbSaved: number;
  mbSaved: number;
  nairaSaved: number;
  formattedKb: string;
  formattedMb: string;
  formattedNaira: string;
}

export function calculateDataSavedMetrics(
  bytesSaved: number,
  nairaPerMb: number = REMOTE_CONFIG_DEFAULTS.telemetry_naira_per_mb,
): DataSavedMetrics {
  const safeBytes = Math.max(0, Math.round(bytesSaved));
  const safeRate =
    typeof nairaPerMb === "number" && Number.isFinite(nairaPerMb) && nairaPerMb >= 0
      ? nairaPerMb
      : REMOTE_CONFIG_DEFAULTS.telemetry_naira_per_mb;

  const kbSaved = safeBytes / 1024;
  const mbSaved = safeBytes / 1_048_576;
  const nairaSaved = mbSaved * safeRate;

  const formattedKb = `${Math.round(kbSaved)} KB`;
  const formattedMb = `${mbSaved.toFixed(2)} MB`;
  const formattedNaira = `\u20A6${nairaSaved.toFixed(2)}`;

  return {
    bytesSaved: safeBytes,
    kbSaved: Number(kbSaved.toFixed(2)),
    mbSaved: Number(mbSaved.toFixed(4)),
    nairaSaved: Number(nairaSaved.toFixed(4)),
    formattedKb,
    formattedMb,
    formattedNaira,
  };
}

export interface UseDataSavedResult extends DataSavedMetrics {
  cloudDrillKb: number;
  nairaPerMb: number;
  onDeviceCount: number;
  cachedReplayCount: number;
}

export function useDataSaved(): UseDataSavedResult {
  const { summary } = useInferenceTelemetry();
  const nairaPerMb = useRemoteConfigNumber("telemetry_naira_per_mb");
  const cloudDrillKb = useRemoteConfigNumber("telemetry_cloud_drill_kb");

  return useMemo(() => {
    const metrics = calculateDataSavedMetrics(summary.bytesSaved, nairaPerMb);
    return {
      ...metrics,
      cloudDrillKb,
      nairaPerMb,
      onDeviceCount: summary.onDeviceCount,
      cachedReplayCount: summary.cachedReplayCount,
    };
  }, [
    summary.bytesSaved,
    summary.onDeviceCount,
    summary.cachedReplayCount,
    nairaPerMb,
    cloudDrillKb,
  ]);
}
