"use client";

import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/firebase/client";
import {
  rcBoolean,
  rcNumber,
  rcString,
  subscribeToConfigUpdates,
} from "@/lib/firebase/remote-config";
import {
  REMOTE_CONFIG_DEFAULTS,
  type RemoteConfigKey,
} from "@/lib/firebase/remote-config-defaults";

export function useRemoteConfigString(key: RemoteConfigKey): string {
  const [value, setValue] = useState<string>(() => String(REMOTE_CONFIG_DEFAULTS[key]));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { remoteConfig } = getFirebase();
      setValue(rcString(remoteConfig, key));
      unsubscribe = subscribeToConfigUpdates(remoteConfig, (updatedKeys) => {
        if (updatedKeys.has(key)) {
          setValue(rcString(remoteConfig, key));
        }
      });
    } catch {
      // Fall back to default value if Firebase config is unavailable.
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [key]);

  return value;
}

export function useRemoteConfigNumber(key: RemoteConfigKey): number {
  const [value, setValue] = useState<number>(() => Number(REMOTE_CONFIG_DEFAULTS[key]));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { remoteConfig } = getFirebase();
      setValue(rcNumber(remoteConfig, key));
      unsubscribe = subscribeToConfigUpdates(remoteConfig, (updatedKeys) => {
        if (updatedKeys.has(key)) {
          setValue(rcNumber(remoteConfig, key));
        }
      });
    } catch {
      // Fall back to default value if Firebase config is unavailable.
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [key]);

  return value;
}

export function useRemoteConfigBoolean(key: RemoteConfigKey): boolean {
  const [value, setValue] = useState<boolean>(() => Boolean(REMOTE_CONFIG_DEFAULTS[key]));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { remoteConfig } = getFirebase();
      setValue(rcBoolean(remoteConfig, key));
      unsubscribe = subscribeToConfigUpdates(remoteConfig, (updatedKeys) => {
        if (updatedKeys.has(key)) {
          setValue(rcBoolean(remoteConfig, key));
        }
      });
    } catch {
      // Fall back to default value if Firebase config is unavailable.
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [key]);

  return value;
}
