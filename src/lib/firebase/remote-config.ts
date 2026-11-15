"use client";

import type { FirebaseApp } from "firebase/app";
import {
  activate,
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  onConfigUpdate,
  type RemoteConfig,
} from "firebase/remote-config";
import { REMOTE_CONFIG_DEFAULTS, type RemoteConfigKey } from "./remote-config-defaults";

export function initRemoteConfig(app: FirebaseApp): RemoteConfig {
  const rc = getRemoteConfig(app);
  rc.settings.minimumFetchIntervalMillis =
    process.env.NODE_ENV === "development" ? 0 : 3_600_000;
  rc.settings.fetchTimeoutMillis = 10_000;
  rc.defaultConfig = { ...REMOTE_CONFIG_DEFAULTS };
  return rc;
}

export async function refreshRemoteConfig(rc: RemoteConfig): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    // Last activated values persist in SDK storage for offline use.
    return false;
  }
  try {
    return await fetchAndActivate(rc);
  } catch {
    // Keep last activated or default values. Never block the UI on config.
    return false;
  }
}

export function subscribeToConfigUpdates(
  rc: RemoteConfig,
  onChange: (keys: Set<string>) => void,
): () => void {
  return onConfigUpdate(rc, {
    next: async (update) => {
      await activate(rc);
      onChange(update.getUpdatedKeys());
    },
    error: () => {
      // Real-time channel failed; periodic fetch remains as fallback.
    },
    complete: () => {},
  });
}

export function rcString(rc: RemoteConfig, key: RemoteConfigKey): string {
  return getValue(rc, key).asString();
}

export function rcNumber(rc: RemoteConfig, key: RemoteConfigKey): number {
  return getValue(rc, key).asNumber();
}

export function rcBoolean(rc: RemoteConfig, key: RemoteConfigKey): boolean {
  return getValue(rc, key).asBoolean();
}

export function rcJson<T>(
  rc: RemoteConfig,
  key: RemoteConfigKey,
  guard: (v: unknown) => v is T,
  fallback: T,
): T {
  try {
    const parsed: unknown = JSON.parse(getValue(rc, key).asString());
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
