"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { TelemetryProvider } from "@/hooks/useInferenceTelemetry";
import { NanoReadinessProvider } from "@/hooks/useNanoReadiness";
import { registerServiceWorker } from "@/lib/db/idb";
import { getFirebase, type FirebaseServices } from "@/lib/firebase/client";
import {
  refreshRemoteConfig,
  subscribeToConfigUpdates,
} from "@/lib/firebase/remote-config";
import { startSyncEngine } from "@/lib/sync/sync-engine";

export interface FirebaseContextValue {
  services: FirebaseServices | null;
  ready: boolean;
  configVersion: number;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  services: null,
  ready: false,
  configVersion: 0,
  error: null,
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [configVersion, setConfigVersion] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let stopSync: (() => void) | undefined;

    if (process.env.NODE_ENV === "production") {
      void registerServiceWorker();
    } else if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Prevent cached dev chunks from causing hydration skew across HMR rebuilds.
      void navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())));
    }

    try {
      const firebase = getFirebase();
      setServices(firebase);
      setReady(true);
      stopSync = startSyncEngine();

      void refreshRemoteConfig(firebase.remoteConfig).then((activated) => {
        if (active && activated) {
          setConfigVersion((v) => v + 1);
        }
      });

      unsubscribe = subscribeToConfigUpdates(firebase.remoteConfig, () => {
        if (active) {
          setConfigVersion((v) => v + 1);
        }
      });
    } catch (err: unknown) {
      if (active) {
        setError(err instanceof Error ? err.message : "Failed to initialize Firebase.");
      }
    }

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (stopSync) {
        stopSync();
      }
    };
  }, []);

  return (
    <FirebaseContext.Provider value={{ services, ready, configVersion, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  return useContext(FirebaseContext);
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <NanoReadinessProvider>
        <TelemetryProvider>{children}</TelemetryProvider>
      </NanoReadinessProvider>
    </FirebaseProvider>
  );
}
