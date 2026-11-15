const FORBIDDEN_KEYS = [
  "topK",
  "topP",
  "top_k",
  "top_p",
  "presencePenalty",
  "frequencyPenalty",
] as const;

export const META_CLOUD_FALLBACK_KEY = "cloudFallbackDailyUsage";
const STORAGE_KEY = "sokomu:cloudFallbackDailyUsage";
const IDB_NAME = "sokomu";

export interface CloudFallbackUsage {
  dateKey: string;
  count: number;
}

export interface CloudFallbackStorageAdapter {
  read: () => string | null;
  write: (serialized: string) => void;
  clear: () => void;
}

export function sanitizeGenerationConfig<T extends Record<string, unknown>>(
  config: T,
): T {
  const clean: Record<string, unknown> = { ...config };
  for (const key of FORBIDDEN_KEYS) {
    delete clean[key];
  }

  const thinking = clean["thinkingConfig"];
  if (thinking && typeof thinking === "object" && "thinkingLevel" in thinking) {
    const level = (thinking as { thinkingLevel?: unknown }).thinkingLevel;
    if (typeof level === "string" && level.toUpperCase() === "MINIMAL") {
      delete clean["thinkingConfig"];
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    Object.keys(clean).length !== Object.keys(config).length
  ) {
    console.warn("[sokomu] Removed forbidden generationConfig keys.");
  }

  return clean as T;
}

let inMemoryUsage: CloudFallbackUsage | null = null;
let customStorageAdapter: CloudFallbackStorageAdapter | null = null;

function readStorageRaw(): string | null {
  if (customStorageAdapter) {
    return customStorageAdapter.read();
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorageRaw(usage: CloudFallbackUsage): void {
  const serialized = JSON.stringify(usage);
  if (customStorageAdapter) {
    customStorageAdapter.write(serialized);
    return;
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Ignore quota or private mode storage failures; in-memory state stays accurate.
    }
  }
  void mirrorUsageToIdb(usage);
}

function clearStorageRaw(): void {
  if (customStorageAdapter) {
    customStorageAdapter.clear();
    return;
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage removal errors.
    }
  }
}

function parseUsage(raw: string | null): CloudFallbackUsage | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "dateKey" in parsed &&
      "count" in parsed
    ) {
      const candidate = parsed as { dateKey?: unknown; count?: unknown };
      if (
        typeof candidate.dateKey === "string" &&
        typeof candidate.count === "number" &&
        Number.isInteger(candidate.count) &&
        candidate.count >= 0
      ) {
        return { dateKey: candidate.dateKey, count: candidate.count };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function openExistingSokomuMetaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  if (typeof indexedDB.databases === "function") {
    const existing = await indexedDB.databases();
    if (!existing.some((db) => db.name === IDB_NAME)) {
      return null;
    }
  } else {
    // Avoid creating an empty version-1 database before idb.ts runs its schema upgrade.
    return null;
  }

  return await new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("meta")) {
          db.close();
          resolve(null);
          return;
        }
        resolve(db);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function mirrorUsageToIdb(usage: CloudFallbackUsage): Promise<void> {
  const db = await openExistingSokomuMetaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction("meta", "readwrite");
      const store = tx.objectStore("meta");
      store.put({ key: META_CLOUD_FALLBACK_KEY, value: usage });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function syncCloudFallbackUsageWithIdb(
  now: Date = new Date(),
): Promise<number> {
  const today = getTodayUtcDateKey(now);
  const db = await openExistingSokomuMetaDb();
  if (!db) {
    return getCloudFallbackCountToday(now);
  }

  const idbUsage = await new Promise<CloudFallbackUsage | null>((resolve) => {
    try {
      const tx = db.transaction("meta", "readonly");
      const req = tx.objectStore("meta").get(META_CLOUD_FALLBACK_KEY);
      req.onsuccess = () => {
        const record = req.result as { value?: unknown } | undefined;
        const val = record?.value;
        if (
          typeof val === "object" &&
          val !== null &&
          "dateKey" in val &&
          "count" in val &&
          (val as CloudFallbackUsage).dateKey === today &&
          typeof (val as CloudFallbackUsage).count === "number"
        ) {
          resolve(val as CloudFallbackUsage);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
      tx.oncomplete = () => db.close();
      tx.onabort = () => db.close();
    } catch {
      db.close();
      resolve(null);
    }
  });

  const localCount = getCloudFallbackCountToday(now);
  if (idbUsage && idbUsage.count > localCount) {
    inMemoryUsage = idbUsage;
    writeStorageRaw(idbUsage);
    return idbUsage.count;
  }

  if (localCount > 0) {
    await mirrorUsageToIdb({ dateKey: today, count: localCount });
  }
  return localCount;
}

export function setCloudFallbackTestStore(
  adapter: CloudFallbackStorageAdapter | null,
): void {
  customStorageAdapter = adapter;
  inMemoryUsage = null;
}

export function resetCloudFallbackUsage(): void {
  inMemoryUsage = null;
  clearStorageRaw();
}

export function getTodayUtcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getCloudFallbackCountToday(now: Date = new Date()): number {
  const today = getTodayUtcDateKey(now);
  if (inMemoryUsage && inMemoryUsage.dateKey === today) {
    return inMemoryUsage.count;
  }
  const stored = parseUsage(readStorageRaw());
  if (stored && stored.dateKey === today) {
    inMemoryUsage = stored;
    return stored.count;
  }
  inMemoryUsage = { dateKey: today, count: 0 };
  return 0;
}

export function canUseCloudFallback(
  dailyLimit: number,
  cloudFallbackEnabled = true,
  now: Date = new Date(),
): boolean {
  if (!cloudFallbackEnabled) return false;
  if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) return false;
  return getCloudFallbackCountToday(now) < dailyLimit;
}

export function incrementCloudFallbackCount(now: Date = new Date()): number {
  const today = getTodayUtcDateKey(now);
  const nextCount = getCloudFallbackCountToday(now) + 1;
  const nextUsage: CloudFallbackUsage = { dateKey: today, count: nextCount };
  inMemoryUsage = nextUsage;
  writeStorageRaw(nextUsage);
  return nextCount;
}
