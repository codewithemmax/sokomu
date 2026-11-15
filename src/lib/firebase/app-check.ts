"use client";

import type { FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { appCheckDebugToken, recaptchaEnterpriseSiteKey } from "./config";

let appCheckInstance: AppCheck | null = null;

export function initAppCheck(app: FirebaseApp): AppCheck {
  if (typeof window === "undefined") {
    throw new Error("initAppCheck must only run in the browser.");
  }
  if (appCheckInstance) {
    return appCheckInstance;
  }

  // Debug mode: local development and judge testing only.
  // Must be assigned BEFORE initializeAppCheck is called.
  if (appCheckDebugToken) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN =
      appCheckDebugToken === "true" ? true : appCheckDebugToken;
  }

  let siteKey = recaptchaEnterpriseSiteKey;
  if (!siteKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY.");
    }
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true;
    siteKey = "debug-placeholder-site-key";
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });

  return appCheckInstance;
}
