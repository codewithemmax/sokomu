"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import type { AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import type { RemoteConfig } from "firebase/remote-config";
import { getAI, GoogleAIBackend, type AI } from "firebase/ai";
import { assertFirebaseConfig, firebaseConfig } from "./config";
import { initAppCheck } from "./app-check";
import { initRemoteConfig } from "./remote-config";

export interface FirebaseServices {
  app: FirebaseApp;
  appCheck: AppCheck;
  auth: Auth;
  db: Firestore;
  remoteConfig: RemoteConfig;
  ai: AI;
}

let services: FirebaseServices | null = null;

function getFirestoreInstance(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}

export function getFirebase(): FirebaseServices {
  if (typeof window === "undefined") {
    throw new Error(
      "getFirebase() called during server rendering. Call it inside useEffect or an event handler.",
    );
  }
  if (services) {
    return services;
  }

  assertFirebaseConfig();

  // Fixed initialization order:
  // 1. App
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // 2. App Check (must precede every other product)
  const appCheck = initAppCheck(app);
  // 3. Auth, Firestore, Remote Config, and AI Logic
  const auth = getAuth(app);
  const db = getFirestoreInstance(app);
  const remoteConfig = initRemoteConfig(app);
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  services = { app, appCheck, auth, db, remoteConfig, ai };
  return services;
}
