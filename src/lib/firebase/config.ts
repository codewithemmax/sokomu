export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// NEXT_PUBLIC_* values must be referenced literally so Next.js can inline them at build time.
export const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

export const recaptchaEnterpriseSiteKey =
  process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY ?? "";

export const appCheckDebugToken =
  process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ?? "";

export function assertFirebaseConfig(config: FirebaseWebConfig = firebaseConfig): void {
  const missing = Object.entries(config)
    .filter(([key, value]) => key !== "measurementId" && !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase config values: ${missing.join(", ")}. Copy .env.example to .env.local.`,
    );
  }
}
