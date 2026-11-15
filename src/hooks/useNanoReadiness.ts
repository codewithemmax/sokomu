"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { checkNanoAvailability, downloadNano } from "@/lib/ai/nano";
import type { NanoStatus } from "@/types/ai";
import type { NanoStatusState } from "@/types/domain";

export interface NanoReadinessContextValue {
  status: NanoStatus;
  statusState: NanoStatusState;
  refresh: () => Promise<NanoStatus>;
  startDownload: () => Promise<NanoStatus>;
  cancelDownload: () => void;
}

const DEFAULT_STATUS: NanoStatus = { state: "checking" };

export function toNanoStatusState(status: NanoStatus): NanoStatusState {
  switch (status.state) {
    case "ready":
      return "ready";
    case "unsupported":
      return "unsupported";
    default:
      return "fallback";
  }
}

function mapAvailabilityToStatus(
  availability: LanguageModelAvailability | "unsupported",
): NanoStatus {
  switch (availability) {
    case "available":
      return { state: "ready" };
    case "downloadable":
      return { state: "downloadable" };
    case "downloading":
      return { state: "downloading", progress: 0 };
    case "unsupported":
      return { state: "unsupported" };
    default:
      return { state: "unavailable" };
  }
}

const NanoReadinessContext = createContext<NanoReadinessContextValue>({
  status: DEFAULT_STATUS,
  statusState: "fallback",
  refresh: async () => DEFAULT_STATUS,
  startDownload: async () => DEFAULT_STATUS,
  cancelDownload: () => {},
});

export function NanoReadinessProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NanoStatus>(DEFAULT_STATUS);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  const refresh = useCallback(async (): Promise<NanoStatus> => {
    const availability = await checkNanoAvailability();
    const mapped = mapAvailabilityToStatus(availability);
    if (mountedRef.current) {
      setStatus(mapped);
    }
    return mapped;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [refresh]);

  const startDownload = useCallback(async (): Promise<NanoStatus> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (mountedRef.current) {
      setStatus({ state: "downloading", progress: 0 });
    }

    try {
      await downloadNano((fraction) => {
        if (mountedRef.current) {
          setStatus({ state: "downloading", progress: fraction });
        }
      }, controller.signal);
      return await refresh();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return await refresh();
      }
      const message =
        err instanceof Error ? err.message : "On-device model download failed.";
      const errored: NanoStatus = { state: "error", message };
      if (mountedRef.current) {
        setStatus(errored);
      }
      return errored;
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [refresh]);

  const cancelDownload = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    void refresh();
  }, [refresh]);

  const value: NanoReadinessContextValue = {
    status,
    statusState: toNanoStatusState(status),
    refresh,
    startDownload,
    cancelDownload,
  };

  return createElement(NanoReadinessContext.Provider, { value }, children);
}

export function useNanoReadiness(): NanoReadinessContextValue {
  return useContext(NanoReadinessContext);
}
